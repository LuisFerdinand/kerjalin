import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ProductStatusBadge } from "@/components/app/badges";
import { ProductEditor } from "@/components/admin/product-editor";
import { getProductAdmin, listCategoryOptions } from "@/lib/queries/catalog";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Ubah produk" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProductDetailAdminPage(props: PageProps<"/admin/produk/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const sp = await props.searchParams;
  if (!UUID.test(id)) notFound();

  const [data, categories] = await Promise.all([getProductAdmin(id), listCategoryOptions()]);
  if (!data) notFound();
  const { product, stats } = data;

  return (
    <>
      <Link
        href="/admin/produk"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-navy"
      >
        <ArrowLeft className="size-4" /> Semua produk
      </Link>
      <PageHeader
        title={product.name}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <ProductStatusBadge status={product.status} />
            <span>{data.categoryName ?? "Tanpa kategori"}</span>
            {product.sku && <span>SKU {product.sku}</span>}
          </span>
        }
      />
      {/* key: form dibuat ulang saat data tersimpan agar semua isian mengikuti nilai terbaru */}
      <ProductEditor
        key={product.updatedAt.toISOString()}
        product={product}
        categories={categories}
        nextOrder={product.sortOrder}
        stats={stats}
        created={sp.baru === "1"}
      />
    </>
  );
}
