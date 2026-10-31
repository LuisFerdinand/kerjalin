import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ProductEditor } from "@/components/admin/product-editor";
import { getProductCountsAdmin, listCategoryOptions } from "@/lib/queries/catalog";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Produk baru" };

export default async function NewProductPage() {
  await requireAdmin();
  const [categories, counts] = await Promise.all([listCategoryOptions(), getProductCountsAdmin()]);

  return (
    <>
      <Link
        href="/admin/produk"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-navy"
      >
        <ArrowLeft className="size-4" /> Semua produk
      </Link>
      <PageHeader
        title="Produk baru"
        description="Isi informasi dasar dulu. Produk dibuat sebagai draf, lalu lengkapi gambar, paket, dan FAQ."
      />
      <ProductEditor product={null} categories={categories} nextOrder={counts.all + 1} />
    </>
  );
}
