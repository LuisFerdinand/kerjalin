import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlayCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

const avatars = ["agus", "sari", "dewi", "rizky", "nadia"];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-glow">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-16 lg:pb-24">
        <div>
          <Reveal immediate>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3.5 py-1.5 text-xs font-semibold text-brand">
              <span className="size-1.5 rounded-full bg-brand" />
              Peluang untuk semua
            </span>
          </Reveal>
          <Reveal immediate delay={0.08}>
            <h1 className="mt-6 text-[2.75rem] leading-[1.04] font-extrabold text-balance text-navy sm:text-6xl lg:text-7xl">
              Butuh penghasilan tambahan?{" "}
              <span className="text-brand">Kerjalin aja!</span>
            </h1>
          </Reveal>
          <Reveal immediate delay={0.16}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy/70">
              Gabung jadi mitra, jual berbagai layanan SaaS untuk UMKM, dapatkan komisi dari setiap
              langganan. Tanpa modal besar, waktu fleksibel, bisa dari mana saja.
            </p>
          </Reveal>
          <Reveal immediate delay={0.24}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 gap-2 px-6 text-base font-semibold shadow-lg shadow-brand/25">
                <Link href="/daftar">
                  Daftar Sekarang <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 gap-2 bg-white/70 px-6 text-base font-semibold"
              >
                <a href="#cara-kerja">
                  <PlayCircle className="size-4.5 text-brand" /> Lihat Cara Kerja
                </a>
              </Button>
            </div>
          </Reveal>
          <Reveal immediate delay={0.32}>
            <div className="mt-9 flex items-center gap-4">
              <div className="flex shrink-0 -space-x-3">
                {avatars.map((a) => (
                  <Image
                    key={a}
                    src={`/images/avatars/${a}.jpg`}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 rounded-full object-cover ring-[3px] ring-background"
                  />
                ))}
              </div>
              <p className="text-sm leading-snug text-navy/70">
                <strong className="text-navy">Pendaftaran agen dibuka.</strong>
                <br />
                Jadilah yang pertama membangun tim di Kerjalin.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal immediate delay={0.2} y={32} className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[460px]">
            <div className="absolute -inset-4 rotate-3 rounded-[2.75rem] bg-brand/10" aria-hidden />
            <div className="absolute -top-6 -right-6 size-28 rounded-full bg-cream" aria-hidden />
            <div className="relative h-full overflow-hidden rounded-[2.5rem] shadow-2xl shadow-navy/20 ring-1 ring-navy/10">
              <Image
                src="/images/hero-woman.jpg"
                alt="Mitra Kerjalin tersenyum"
                fill
                priority
                sizes="(min-width: 1024px) 460px, 90vw"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/35 via-transparent to-transparent" />
            </div>

            <div className="absolute top-6 left-3 animate-float rounded-2xl border border-white/60 bg-white/95 p-3.5 shadow-xl shadow-navy/10 backdrop-blur sm:top-8 sm:-left-10 sm:p-4">
              <p className="text-xs font-medium text-muted-foreground">Komisi masuk</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-xl font-extrabold text-navy">Rp 50.000</p>
                <span className="flex size-5 items-center justify-center rounded-full bg-success/15 text-success">
                  <TrendingUp className="size-3" />
                </span>
              </div>
              <p className="mt-0.5 text-[0.7rem] text-muted-foreground">Contoh 1 langganan Rp 100.000</p>
            </div>

            <div
              className="absolute right-3 bottom-8 animate-float rounded-2xl border border-white/60 bg-white/95 p-3.5 shadow-xl shadow-navy/10 backdrop-blur sm:bottom-10 sm:-right-8 sm:p-4"
              style={{ animationDelay: "-3s" }}
            >
              <p className="text-xs font-medium text-muted-foreground">Estimasi komisi bulanan</p>
              <p className="mt-1 text-xl font-extrabold text-navy">Rp 2.500.000</p>
              <div className="mt-2 flex h-9 items-end gap-1" aria-hidden>
                {[28, 40, 34, 52, 46, 66, 82].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className={i === 6 ? "w-2.5 rounded-sm bg-brand" : "w-2.5 rounded-sm bg-brand/30"}
                  />
                ))}
              </div>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">Ilustrasi, bukan jaminan</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
