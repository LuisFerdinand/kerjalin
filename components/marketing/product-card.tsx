import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Coins, ImageOff } from "lucide-react";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Bagian produk yang dibutuhkan kartu. `CatalogProduct` dan data cadangan sama-sama memenuhinya. */
export type CardProduct = {
  slug: string;
  name: string;
  tagline: string | null;
  categoryName: string | null;
  priceMonthly: number;
  imageUrl: string | null;
  status: "draft" | "coming_soon" | "active" | "archived";
  badge?: string | null;
  featured?: boolean;
};

/** Komisi (Rupiah) dari satu bulan langganan pada persentase tertinggi. */
export function commissionFor(priceMonthly: number, percent: number) {
  return Math.floor((priceMonthly * percent) / 100);
}

/**
 * Kartu produk gaya toko: foto, label, nama, harga, lalu komisi agen.
 * Seluruh kartu bisa diklik lewat tautan pada nama produk.
 */
export function ProductCard({
  product: p,
  topCommission,
  priority = false,
  className,
}: {
  product: CardProduct;
  /** Persen komisi tertinggi, untuk keterangan "Komisi hingga". */
  topCommission: number;
  priority?: boolean;
  className?: string;
}) {
  const soon = p.status === "coming_soon";
  const label = p.badge || (p.featured ? "Unggulan" : null);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-float motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {p.imageUrl ? (
          <Image
            src={p.imageUrl}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <div className="grid h-full place-items-center text-faint">
            <ImageOff className="size-8" aria-hidden />
          </div>
        )}
        {label && (
          <span className="absolute top-3 left-3 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white shadow-sm">
            {label}
          </span>
        )}
        {soon && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy shadow-sm">
            Segera hadir
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {p.categoryName && <p className="text-xs font-semibold tracking-wide text-faint uppercase">{p.categoryName}</p>}
        <h3 className="mt-1 text-[1.0625rem] leading-snug font-bold text-navy">
          <Link href={`/produk/${p.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {p.name}
          </Link>
        </h3>
        {p.tagline && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{p.tagline}</p>}

        <div className="mt-auto pt-5">
          <p className="text-xs text-faint">Harga mulai</p>
          <p className="text-xl font-extrabold tracking-tight text-navy tabular-nums">
            {formatIDR(p.priceMonthly)}
            <span className="text-sm font-medium text-faint"> /bulan</span>
          </p>

          {topCommission > 0 && (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Coins className="size-4 text-navy" aria-hidden />
                Komisi hingga
              </span>
              <span className="text-sm font-bold text-navy tabular-nums">{formatIDR(commissionFor(p.priceMonthly, topCommission))}</span>
            </div>
          )}

          <span className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-navy text-sm font-semibold text-white transition-colors group-hover:bg-navy-soft">
            Lihat Detail
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </article>
  );
}
