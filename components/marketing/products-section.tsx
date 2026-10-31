import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fallbackProducts } from "@/lib/content";
import { formatIDR } from "@/lib/format";
import { getPublicProducts } from "@/lib/queries/public";
import { Reveal } from "./reveal";

export type ProductCardData = {
  slug: string;
  name: string;
  tagline: string | null;
  category: string;
  priceMonthly: number;
  imageUrl: string | null;
  status: "draft" | "coming_soon" | "active" | "archived";
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const soon = product.status === "coming_soon";
  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/10"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-white/95 text-navy hover:bg-white/95">{product.category}</Badge>
          {soon && (
            <Badge className="gap-1 bg-navy text-cream hover:bg-navy">
              <Clock className="size-3" /> Segera hadir
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-navy">{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {product.tagline}
        </p>
        <div className="mt-4 flex items-end justify-between border-t pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Mulai dari</p>
            <p className="text-lg font-extrabold text-navy">
              {formatIDR(product.priceMonthly)}
              <span className="text-xs font-medium text-muted-foreground"> /bulan</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
            Detail
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export async function ProductsSection() {
  const dbProducts = await getPublicProducts();
  const list: ProductCardData[] = dbProducts.length ? dbProducts : fallbackProducts;

  return (
    <section id="produk" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-widest text-brand uppercase">Produk</p>
          <h2 className="mt-3 text-3xl font-extrabold text-balance text-navy sm:text-4xl">
            Layanan yang bisa kamu tawarkan
          </h2>
          <p className="mt-4 text-lg text-navy/70">
            Aplikasi berlangganan yang dibutuhkan pelaku UMKM setiap hari. Mudah dijelaskan, mudah
            dijual, dan terus menghasilkan setiap bulan.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.08}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
