import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { fallbackProducts } from "@/lib/content";
import { getPublicProducts } from "@/lib/queries/public";
import { ProductCard } from "@/components/marketing/products-section";

export const metadata: Metadata = {
  title: "Katalog Layanan",
  description: "Daftar layanan SaaS Kerjalin yang bisa kamu tawarkan ke pelanggan.",
};

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-bold tracking-widest text-brand uppercase">Katalog</p>
        <h1 className="mt-3 text-4xl font-extrabold text-balance text-navy sm:text-5xl">
          Layanan Kerjalin
        </h1>
        <p className="mt-4 text-lg text-navy/70">
          Aplikasi berlangganan untuk membantu usaha pelanggan berjalan lebih rapi. Agen mendapat
          komisi dari setiap langganan.
        </p>
      </div>
      <Suspense fallback={<GridSkeleton />}>
        <ProductGrid />
      </Suspense>
    </div>
  );
}

async function ProductGrid() {
  const dbProducts = await getPublicProducts();
  const list = dbProducts.length ? dbProducts : fallbackProducts;
  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-80 rounded-2xl" />
      ))}
    </div>
  );
}
