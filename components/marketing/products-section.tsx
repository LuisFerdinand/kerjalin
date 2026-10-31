import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fallbackProducts } from "@/lib/content";
import { getPublicProducts } from "@/lib/queries/catalog";
import { ProductCard, type CardProduct } from "./product-card";
import { Reveal } from "./reveal";

/** Produk pilihan di beranda: unggulan lebih dulu. */
export async function ProductsSection({ topCommission }: { topCommission: number }) {
  const dbProducts = await getPublicProducts(8);
  const list: CardProduct[] = dbProducts.length ? dbProducts : fallbackProducts;

  return (
    <section id="produk" className="scroll-mt-24 bg-muted py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] leading-tight font-extrabold text-navy">Produk Pilihan</h2>
            <p className="mt-2 max-w-[52ch] text-muted-foreground">
              Bandingkan harga dan lihat berapa komisi yang bisa kamu dapat dari tiap produk.
            </p>
          </div>
          <Link
            href="/produk"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-input bg-white px-5 text-sm font-semibold text-navy transition-colors hover:border-navy"
          >
            Lihat Semua Produk
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.slice(0, 8).map((p, i) => (
            <li key={p.slug}>
              <Reveal delay={(i % 4) * 0.06} className="h-full">
                <ProductCard product={p} topCommission={topCommission} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
