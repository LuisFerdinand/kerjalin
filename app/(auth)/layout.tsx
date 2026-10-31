import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Wallet, Users } from "lucide-react";
import { Copyright } from "@/components/brand/copyright";
import { Logo } from "@/components/brand/logo";

const points = [
  { icon: BadgeCheck, text: "Pendaftaran gratis, tanpa modal besar" },
  { icon: Wallet, text: "Komisi hingga 50% dari setiap langganan" },
  { icon: Users, text: "Bangun tim dan dapatkan bonus tim" },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy lg:block">
        <Image
          src="/images/hero-team.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-30 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/70 to-navy" />
        <div className="relative flex h-full flex-col justify-between p-12 text-cream">
          <Link href="/" aria-label="Kerjalin — beranda">
            <Logo tone="light" tagline />
          </Link>
          <div className="max-w-md">
            <h2 className="text-4xl leading-tight font-extrabold text-balance text-white">
              Butuh penghasilan tambahan?{" "}
              <span className="text-brand">Kerjalin aja!</span>
            </h2>
            <ul className="mt-8 grid gap-4">
              {points.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-cream/90">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <Icon className="size-4.5 text-brand" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-cream/60">
            <Copyright />. Peluang untuk semua.
          </p>
        </div>
      </aside>

      <main className="flex flex-col bg-background">
        <div className="flex items-center justify-between p-5 sm:p-8">
          <Link href="/" className="lg:hidden" aria-label="Kerjalin — beranda">
            <Logo />
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke beranda
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-12 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}
