import { ArrowUpRight, Bell, CheckCircle2, Link2, Wallet } from "lucide-react";
import { steps } from "@/lib/content";
import { Reveal } from "./reveal";

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[270px]" aria-hidden>
      <div className="absolute -inset-6 rounded-full bg-brand/20 blur-3xl" />
      <div className="relative rounded-[2.6rem] border-[6px] border-[#0d1b3d] bg-[#0d1b3d] p-1 shadow-2xl">
        <div className="overflow-hidden rounded-[2.1rem] bg-background">
          <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-[#0d1b3d]" />
          <div className="space-y-3 p-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] text-muted-foreground">Halo, Agen</p>
                <p className="text-sm font-extrabold text-navy">Dashboard</p>
              </div>
              <span className="flex size-7 items-center justify-center rounded-full bg-accent">
                <Bell className="size-3.5 text-navy" />
              </span>
            </div>

            <div className="rounded-2xl bg-navy p-4 text-white">
              <p className="flex items-center gap-1.5 text-[0.65rem] text-cream/70">
                <Wallet className="size-3" /> Saldo komisi
              </p>
              <p className="mt-1 text-2xl font-extrabold">Rp 850.000</p>
              <p className="mt-1 flex items-center gap-1 text-[0.65rem] text-emerald-300">
                <ArrowUpRight className="size-3" /> +Rp 50.000 hari ini
              </p>
            </div>

            <div className="rounded-xl border bg-card p-3">
              <p className="flex items-center gap-1.5 text-[0.65rem] font-medium text-muted-foreground">
                <Link2 className="size-3" /> Tautan referral kamu
              </p>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-muted px-2.5 py-1.5">
                <span className="truncate text-[0.7rem] font-medium text-navy">kerjalin.id/r/KJAB12CD</span>
                <span className="rounded-md bg-brand px-2 py-0.5 text-[0.6rem] font-semibold text-white">Salin</span>
              </div>
            </div>

            <div className="space-y-2">
              {["Komisi Laundry SaaS", "Bonus tim tingkat 1", "Komisi Laundry SaaS"].map((t, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-xl border bg-card p-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-success/10 text-success">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[0.68rem] font-semibold text-navy">{t}</p>
                    <p className="text-[0.58rem] text-muted-foreground">Hari ini</p>
                  </div>
                  <span className="text-[0.7rem] font-bold text-success">
                    +{[50, 10, 35][i]}.000
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="relative scroll-mt-20 overflow-hidden bg-navy py-20 text-white lg:py-28">
      <div className="absolute -top-40 -left-32 size-96 rounded-full bg-brand/20 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal>
            <p className="text-sm font-bold tracking-widest text-brand uppercase">Cara kerja</p>
            <h2 className="mt-3 text-3xl font-extrabold text-balance sm:text-4xl">
              Mulai menghasilkan dalam 3 langkah mudah
            </h2>
          </Reveal>

          <ol className="mt-10 grid gap-5">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <li className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand text-lg font-extrabold shadow-lg shadow-brand/30">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold">
                      {title}
                      <Icon className="size-4.5 text-brand" />
                    </h3>
                    <p className="mt-1.5 leading-relaxed text-cream/75">{text}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={0.15} className="order-first lg:order-last">
          <PhoneMockup />
        </Reveal>
      </div>
    </section>
  );
}
