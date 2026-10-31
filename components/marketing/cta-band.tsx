import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "./reveal";

const points = ["Pendaftaran gratis, tanpa biaya bulanan", "Link referral dan dashboard siap dipakai", "Komisi dicatat otomatis di setiap penjualan"];

/** Ajakan terakhir sebelum footer. */
export function CtaBand() {
  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
      <div className="relative mx-auto grid max-w-[1240px] overflow-hidden rounded-[2rem] bg-navy text-white lg:grid-cols-[1.2fr_0.8fr]">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-[0.07] invert" />
        <div className="relative p-7 sm:p-10 lg:p-14">
          <Reveal>
            <h2 className="max-w-[16ch] text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] font-extrabold text-balance">
              Siap mulai dapat komisi?
            </h2>
            <p className="mt-4 max-w-[46ch] text-white/75">
              Daftar sekarang. Setelah admin menyetujui akunmu, link referral dan katalog produk langsung bisa kamu pakai.
            </p>
            <ul className="mt-6 grid gap-3 text-sm font-medium">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/daftar"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-navy transition-colors hover:bg-white/90"
              >
                Daftar Sekarang
                <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link
                href="/produk"
                className="inline-flex h-14 items-center justify-center rounded-xl border border-white/30 px-8 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                Lihat Produk
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="relative hidden min-h-[420px] lg:block">
          <Image
            src="/images/mitra-pedagang.jpg"
            alt="Pemilik usaha kecil tersenyum di toko"
            fill
            sizes="(min-width: 1024px) 40vw, 0px"
            className="object-cover object-[50%_25%]"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-navy via-navy/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}
