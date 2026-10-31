import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Link href="/" aria-label="Kerjalin — beranda">
        <Logo />
      </Link>
            <div>
        <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-tight font-bold text-navy">Halaman tidak ditemukan</h1>
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
