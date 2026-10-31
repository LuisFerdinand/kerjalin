import type { Metadata } from "next";
import Link from "next/link";
import { Package, Plus, Search, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { TabsNav } from "@/components/app/tabs-nav";
import { ProductsTable } from "@/components/admin/products-table";
import { PRODUCT_STATUSES } from "@/db/schema";
import {
  ADMIN_PRODUCT_SORTS,
  getProductCountsAdmin,
  listCategoryOptions,
  listProductsAdmin,
  type AdminProductSort,
} from "@/lib/queries/catalog";
import { first, pageParam, pickEnum } from "@/lib/search-params";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Produk" };

export default async function ProductsAdminPage(props: PageProps<"/admin/produk">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = first(sp.q);
  const status = pickEnum(sp.status, PRODUCT_STATUSES);
  const categoryId = first(sp.kategori);
  const sort = pickEnum(sp.urut, Object.keys(ADMIN_PRODUCT_SORTS) as AdminProductSort[]);
  const page = pageParam(sp.hal);

  const [result, counts, categories] = await Promise.all([
    listProductsAdmin({ q, status, categoryId, sort, page }),
    getProductCountsAdmin(),
    listCategoryOptions(),
  ]);

  const tab = (label: string, value: (typeof PRODUCT_STATUSES)[number] | undefined, count: number) => {
    const sp2 = new URLSearchParams();
    if (value) sp2.set("status", value);
    if (q) sp2.set("q", q);
    if (categoryId) sp2.set("kategori", categoryId);
    if (sort) sp2.set("urut", sort);
    const qs = sp2.toString();
    return { label, count, active: status === value, href: qs ? `/admin/produk?${qs}` : "/admin/produk" };
  };

  const hasFilters = Boolean(q || categoryId || status);

  return (
    <>
      <PageHeader
        title="Produk"
        description="Kelola katalog layanan SaaS: harga, paket, gambar, dan status tampil di situs."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/kategori">
                <Tags /> Kategori
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/produk/baru">
                <Plus /> Produk baru
              </Link>
            </Button>
          </>
        }
      />

      <TabsNav
        label="Status produk"
        items={[
          tab("Semua", undefined, counts.all),
          tab("Aktif", "active", counts.active),
          tab("Segera hadir", "coming_soon", counts.coming_soon),
          tab("Draf", "draft", counts.draft),
          tab("Diarsipkan", "archived", counts.archived),
        ]}
      />

      <form action="/admin/produk" className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <Input name="q" defaultValue={q} placeholder="Cari nama, SKU, atau slug" className="pl-9" aria-label="Cari produk" />
        </div>
        <NativeSelect name="kategori" defaultValue={categoryId ?? ""} className="sm:w-48" aria-label="Kategori">
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="urut" defaultValue={sort ?? "urutan"} className="sm:w-52" aria-label="Urutkan">
          {Object.entries(ADMIN_PRODUCT_SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline">
          Terapkan
        </Button>
        {hasFilters && (
          <Button asChild variant="ghost">
            <Link href="/admin/produk">Reset</Link>
          </Button>
        )}
        <p className="text-[0.8125rem] text-muted-foreground sm:ml-auto">{result.total} produk</p>
      </form>

      {result.rows.length === 0 ? (
        <EmptyState
          icon={Package}
          title={hasFilters ? "Tidak ada produk yang cocok" : "Belum ada produk"}
          description={hasFilters ? "Coba ubah kata kunci atau filter." : "Tambahkan produk SaaS pertama, mis. Laundry SaaS."}
          action={
            !hasFilters && (
              <Button asChild>
                <Link href="/admin/produk/baru">
                  <Plus /> Produk baru
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <ProductsTable
            rows={result.rows.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              sku: p.sku,
              imageUrl: p.imageUrl,
              categoryName: p.categoryName,
              status: p.status,
              priceMonthly: p.priceMonthly,
              planCount: p.pricingPlans.length,
              sold: p.sold,
              revenue: p.revenue,
              updatedAt: p.updatedAt.toISOString(),
              featured: p.featured,
              badge: p.badge,
            }))}
          />
        </div>
      )}

      <div className="pt-4">
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          basePath="/admin/produk"
          pageKey="hal"
          params={{ q, status, kategori: categoryId, urut: sort }}
        />
      </div>
    </>
  );
}
