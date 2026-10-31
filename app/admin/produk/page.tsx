import type { Metadata } from "next";
import Image from "next/image";
import { ImageIcon, Package, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductStatusBadge } from "@/components/app/badges";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { DeleteProductButton, ProductFormDialog } from "@/components/admin/product-form";
import { formatIDR } from "@/lib/format";
import { listProductsAdmin } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Produk" };

export default async function ProductsAdminPage() {
  await requireAdmin();
  const items = await listProductsAdmin();
  const nextOrder = (items.at(-1)?.sortOrder ?? 0) + 1;

  const addButton = (
    <ProductFormDialog
      nextOrder={nextOrder}
      trigger={
        <Button>
          <Plus /> Tambah produk
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader
        title="Produk"
        description="Kelola layanan SaaS yang dijual lewat agen. Produk berstatus Aktif atau Segera hadir tampil di situs publik."
        actions={addButton}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Belum ada produk"
          description="Tambahkan produk SaaS pertama, mis. Laundry SaaS."
          action={addButton}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <Card key={p.id} className="gap-0 overflow-hidden p-0">
              <div className="relative aspect-[16/9] bg-muted">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    sizes="(min-width: 1280px) 420px, (min-width: 640px) 45vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="size-8" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <ProductStatusBadge status={p.status} />
                </div>
              </div>
              <div className="grid flex-1 gap-3 p-5">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{p.category}</p>
                  <h3 className="text-lg font-extrabold text-navy">{p.name}</h3>
                  {p.tagline && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.tagline}</p>}
                </div>
                <div className="flex items-end justify-between border-t pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{p.features.length} fitur · /{p.slug}</p>
                    <p className="text-lg font-extrabold text-navy tabular-nums">
                      {formatIDR(p.priceMonthly)}
                      <span className="text-xs font-medium text-muted-foreground"> /bulan</span>
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <ProductFormDialog
                      product={{
                        id: p.id,
                        name: p.name,
                        slug: p.slug,
                        category: p.category,
                        tagline: p.tagline,
                        description: p.description,
                        priceMonthly: p.priceMonthly,
                        features: p.features,
                        status: p.status,
                        sortOrder: p.sortOrder,
                        imageUrl: p.imageUrl,
                      }}
                      nextOrder={nextOrder}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Pencil /> Ubah
                        </Button>
                      }
                    />
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
