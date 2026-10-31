import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Copyright } from "@/components/brand/copyright";
import { Logo } from "@/components/brand/logo";

const points = [
  "Pendaftaran gratis, tanpa modal besar",
  "Komisi hingga 50% dari setiap langganan",
  "Bangun tim dan dapatkan bonus tim",
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen gap-3 p-3 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden rounded-2xl bg-navy lg:block">
        <Image
          src="/images/mitra-bangku.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-navy/60" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" aria-label="Kerjalin, beranda">
            <Logo tone="light" tagline />
          </Link>
          <div className="max-w-md">
            <p className="text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.05] font-bold tracking-tight text-balance text-white">
              Butuh penghasilan tambahan? Kerjalin aja!
            </p>
            <ul className="mt-8 grid gap-3 text-[1.0625rem]">
              {points.map((text) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15">
                    <Check className="size-3.5" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[0.9375rem] text-white/85">
            <Copyright />. Peluang untuk semua.
          </p>
        </div>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link href="/" className="lg:hidden" aria-label="Kerjalin, beranda">
            <Logo />
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-[0.9375rem] font-medium text-navy hover:underline"
          >
            <ArrowLeft className="size-4" />
            Kembali ke beranda
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-12 sm:px-0">{children}</div>
      </main>
    </div>
  );
}
