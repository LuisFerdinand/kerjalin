import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function CtaBand() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:pb-28">
      <Reveal>
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-navy">
          <Image
            src="/images/jakarta.jpg"
            alt=""
            fill
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="object-cover opacity-25 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-brand/40" />
          <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:p-16">
            <div>
              <h2 className="text-3xl leading-tight font-extrabold text-balance text-white sm:text-4xl lg:text-5xl">
                Butuh penghasilan tambahan?
                <br />
                <span className="text-brand">Kerjalin aja!</span>
              </h2>
              <p className="mt-4 max-w-xl text-lg text-cream/80">
                Dari Sabang sampai Merauke, ayo bangun peluang bersama. Daftar gratis dan jadi
                bagian dari jaringan agen Kerjalin hari ini.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <Button asChild size="lg" className="h-13 gap-2 px-7 text-base font-bold shadow-xl shadow-brand/30">
                <Link href="/daftar">
                  Daftar Sekarang <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-13 border-white/25 bg-white/5 px-7 text-base font-semibold text-white hover:bg-white/15 hover:text-white"
              >
                <Link href="/masuk">Sudah punya akun? Masuk</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
