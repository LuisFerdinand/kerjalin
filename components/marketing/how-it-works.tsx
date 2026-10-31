import Link from "next/link";
import { ArrowRight, Bell, Copy, Link2, MessageCircle, QrCode, Share2, TrendingUp } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { steps } from "@/lib/content";
import { Reveal } from "./reveal";

/** Contoh layar ponsel agen: tautan referral dan komisi yang masuk. Hanya ilustrasi. */
function PhoneMock() {
  return (
    <div
      aria-hidden
      className="relative w-[286px] rounded-[2.6rem] border-[9px] border-navy-deep bg-white p-4 text-navy shadow-[0_30px_80px_-20px_rgb(0_0_0/0.55)] ring-1 ring-white/10"
    >
      <div className="mx-auto h-5 w-24 rounded-full bg-navy-deep" />
      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <LogoMark className="size-7" />
          Kerjalin
        </span>
        <Bell className="size-4 text-faint" />
      </div>

      <p className="mt-5 text-xs font-medium text-faint">Link referral kamu</p>
      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-muted p-1.5 pl-3">
        <Link2 className="size-4 shrink-0 text-faint" />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">kerjalin.id/r/KJ7ERRTU</span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-navy px-3 py-1.5 text-[0.6875rem] font-semibold text-white">
          <Copy className="size-3" />
          Salin
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[0.6875rem] font-semibold">
        {[
          { icon: MessageCircle, label: "WhatsApp" },
          { icon: Share2, label: "Bagikan" },
          { icon: QrCode, label: "Kode QR" },
        ].map(({ icon: Icon, label }) => (
          <span key={label} className="grid justify-items-center gap-1 rounded-xl border border-border py-2.5">
            <Icon className="size-4" />
            {label}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-navy p-4 text-white">
        <p className="text-xs text-white/70">Komisi Didapat</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-xl font-extrabold tabular-nums">Rp 850.000</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[0.6875rem] font-semibold">
            <TrendingUp className="size-3" />
            +12%
          </span>
        </div>
      </div>

      <ul className="mt-3 grid gap-2 text-xs">
        {[
          ["Laundry SaaS", "Bu Tini", "+ Rp 50.000"],
          ["Kasir UMKM", "Mas Dimas", "+ Rp 37.500"],
          ["Toko Online UMKM", "Mbak Citra", "+ Rp 30.000"],
        ].map(([product, buyer, amount]) => (
          <li key={product} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5">
            <span>
              <span className="block font-bold">{product}</span>
              <span className="text-faint">{buyer}</span>
            </span>
            <span className="font-bold text-positive tabular-nums">{amount}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-[0.625rem] text-faint">Contoh tampilan</p>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="scroll-mt-24 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
      <div className="relative mx-auto grid max-w-[1240px] overflow-hidden rounded-[2rem] bg-navy text-white lg:min-h-[600px] lg:grid-cols-[1.15fr_0.85fr]">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-[0.07] invert" />

        <div className="relative p-7 sm:p-10 lg:p-14">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,3.4vw,2.75rem)] leading-tight font-extrabold">Cara Kerja Kerjalin</h2>
            <p className="mt-3 max-w-[44ch] text-white/75">Mulai menghasilkan dalam 3 langkah mudah.</p>
          </Reveal>

          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="relative">
                <Reveal delay={i * 0.1}>
                  <span className="relative z-10 grid size-12 place-items-center rounded-full bg-white text-lg font-extrabold text-navy shadow-lg">
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute top-6 left-14 hidden w-[calc(100%-2rem)] border-t-2 border-dashed border-white/25 sm:block"
                    />
                  )}
                  <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>

          <Reveal delay={0.3}>
            <Link
              href="/daftar"
              className="mt-10 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-navy transition-colors hover:bg-white/90"
            >
              Daftar Sekarang
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Reveal>
        </div>

        <div className="relative flex h-[440px] items-start justify-center overflow-hidden px-4 pt-2 lg:h-auto lg:items-end lg:justify-end lg:pr-14 lg:pt-14">
          <Reveal delay={0.15} y={40} className="lg:translate-y-24">
            <PhoneMock />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
