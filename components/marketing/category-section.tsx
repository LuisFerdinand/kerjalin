import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { Reveal } from "./reveal";

export type CategoryTile = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  count: number;
};

const COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

export function CategorySection({ categories }: { categories: CategoryTile[] }) {
  const tiles = categories.slice(0, 5);
  if (tiles.length === 0) return null;
  const cols = COLS[tiles.length] ?? "lg:grid-cols-3 xl:grid-cols-5";

  return (
    <section id="kategori" className="scroll-mt-24 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] leading-tight font-extrabold text-navy">Produk yang Bisa Kamu Jual</h2>
            <p className="mt-2 max-w-[52ch] text-muted-foreground">
              Pilih dari berbagai aplikasi dan layanan yang sudah dirancang untuk kebutuhan usaha kecil di sekitarmu.
            </p>
          </div>
          <Link href="/produk" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-navy hover:underline">
            Lihat Semua Produk
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>

        <ul className={`mt-8 grid gap-4 sm:grid-cols-2 ${cols}`}>
          {tiles.map((c, i) => (
            <li key={c.id}>
              <Reveal delay={i * 0.06} className="h-full">
                <Link
                  href={`/produk?kategori=${c.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-float motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span className="relative block aspect-[16/10] overflow-hidden bg-muted">
                    {c.imageUrl ? (
                      <Image
                        src={c.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 230px, (min-width: 640px) 45vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-faint">
                        <Tag className="size-8" aria-hidden />
                      </span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col p-4">
                    <span className="font-bold text-navy">{c.name}</span>
                    {c.description && <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{c.description}</span>}
                    <span className="mt-auto flex items-center justify-between pt-4 text-sm font-semibold text-navy">
                      <span>{c.count} produk</span>
                      <span className="inline-flex items-center gap-1.5">
                        Lihat Produk
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </span>
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
