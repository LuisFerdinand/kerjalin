import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, PlayCircle, Sparkles } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { Rise } from "./rise";

/** Batang kecil untuk kartu "Total Komisi". Tinggi dalam persen. */
const BARS = [28, 40, 34, 52, 46, 68, 84];

export function Hero({ topCommission }: { topCommission: number }) {
  const trust = ["Daftar gratis", `Komisi hingga ${formatPercent(topCommission)}`, "Cair ke rekening bank"];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-muted via-white to-white">
      <div aria-hidden className="bg-dots pointer-events-none absolute -top-10 -right-24 hidden size-[520px] opacity-60 lg:block [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />

      <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-10 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.02fr_1fr] lg:gap-8 lg:px-8 lg:pt-16 lg:pb-28">
        <div>
          <Rise>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-semibold text-navy shadow-sm">
              <Sparkles className="size-4" aria-hidden />
              Peluang untuk Semua
            </span>
          </Rise>

          <Rise delay={0.08}>
            <h1 className="mt-6 text-[clamp(2.75rem,6.4vw,4.75rem)] leading-[1.02] font-extrabold tracking-tight text-navy">
              Butuh
              <br />
              penghasilan
              <br />
              tambahan?
              <br />
              <span className="mt-2 inline-block -rotate-1 rounded-2xl bg-navy px-4 pb-1.5 text-white shadow-float">Kerjalin aja!</span>
            </h1>
          </Rise>

          <Rise delay={0.16}>
            <p className="mt-7 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
              Gabung jadi mitra Kerjalin, tawarkan aplikasi dan layanan digital untuk UMKM, lalu dapatkan komisi dari setiap
              langganan. Tanpa modal besar.
            </p>
          </Rise>

          <Rise delay={0.24}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/daftar"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-navy px-8 text-base font-semibold text-white shadow-float transition-colors hover:bg-navy-soft"
              >
                Daftar Sekarang
                <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link
                href="/#cara-kerja"
                className="inline-flex h-14 items-center justify-center gap-2.5 rounded-xl border border-border bg-white px-7 text-base font-semibold text-navy shadow-sm transition-colors hover:border-navy"
              >
                <PlayCircle className="size-5" aria-hidden />
                Lihat Cara Kerja
              </Link>
            </div>
          </Rise>

          <Rise delay={0.32}>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-navy">
              {trust.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-navy text-white">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Rise>
        </div>

        <Rise delay={0.12} y={32} className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
          <div className="relative ml-auto aspect-[4/4.6] w-full max-w-[520px]">
            <div aria-hidden className="absolute -top-4 -right-4 size-3/4 rounded-[3rem] bg-navy/10" />
            <div className="absolute inset-0 overflow-hidden rounded-[2.25rem] bg-navy shadow-float">
              <Image
                src="/images/hero-indonesia.jpg"
                alt="Mitra Kerjalin tersenyum sambil memegang ponsel"
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover object-[52%_20%]"
              />
            </div>

            {/* Kartu contoh tampilan dashboard */}
            <div
              role="img"
              aria-label="Contoh kartu komisi masuk Rp 1.250.000"
              className="animate-float absolute top-[14%] -left-2 z-10 rounded-2xl bg-white px-4 py-3 shadow-float sm:-left-8"
            >
              <p className="text-xs font-medium text-faint">Komisi Masuk</p>
              <div className="mt-1 flex items-center gap-3">
                <p className="text-xl font-extrabold tracking-tight text-navy tabular-nums">Rp 1.250.000</p>
                <span className="grid size-7 place-items-center rounded-full bg-positive/15 text-positive">
                  <ArrowUpRight className="size-4" aria-hidden />
                </span>
              </div>
            </div>

            <div
              role="img"
              aria-label="Contoh kartu total komisi Rp 4.320.000, naik 32 persen dari bulan lalu"
              className="animate-float-slow absolute -bottom-5 left-3 z-10 w-[250px] rounded-2xl bg-white p-4 shadow-float sm:-left-10"
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-faint">Total Komisi</p>
                  <p className="mt-1 text-xl font-extrabold tracking-tight text-navy tabular-nums">Rp 4.320.000</p>
                  <p className="mt-1 text-xs font-semibold text-positive tabular-nums">+32% dari bulan lalu</p>
                </div>
                <div aria-hidden className="flex h-12 items-end gap-1">
                  {BARS.map((h, i) => (
                    <span key={i} className="w-2 rounded-sm bg-navy" style={{ height: `${h}%`, opacity: 0.35 + i * 0.1 }} />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-[0.6875rem] text-faint">Contoh tampilan dashboard</p>
            </div>

            <div aria-hidden className="absolute -top-2 right-0 z-10 hidden w-[190px] -rotate-6 sm:block lg:-right-6">
              <p className="font-hand text-[1.65rem] leading-[1.05] text-navy">Waktu fleksibel, bisa dari mana saja</p>
              <svg viewBox="0 0 60 50" fill="none" className="mt-1 ml-6 h-11 w-14 text-navy">
                <path d="M6 6C26 4 44 16 40 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M32 34L40 42L47 31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </Rise>
      </div>
    </section>
  );
}
