import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Link href="/" aria-label="Kerjalin — beranda">
        <Logo />
      </Link>
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Compass className="size-8" />
      </span>
      <div>
        <h1 className="text-4xl font-extrabold text-navy">Halaman tidak ditemukan</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Alamat yang kamu tuju tidak ada atau sudah dipindahkan. Yuk kembali ke beranda.
        </p>
      </div>
      <Button asChild size="lg" className="h-11 px-6 font-semibold">
        <Link href="/">Kembali ke beranda</Link>
      </Button>
    </div>
  );
}
