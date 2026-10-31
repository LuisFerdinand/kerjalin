import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { navLinks } from "@/lib/content";
import { MobileNav } from "./mobile-nav";

function GuestButtons() {
  return (
    <>
      <Button asChild variant="ghost" size="lg" className="h-10 px-4 text-sm font-semibold">
        <Link href="/masuk">Masuk</Link>
      </Button>
      <Button asChild size="lg" className="h-10 px-5 text-sm font-semibold shadow-sm shadow-brand/30">
        <Link href="/daftar">Daftar Sekarang</Link>
      </Button>
    </>
  );
}

/** Cek cepat ada tidaknya cookie sesi (validasi penuh dilakukan di dashboard). */
async function AuthButtons() {
  const hasSession = (await cookies()).getAll().some((c) => c.name.endsWith("session_token"));
  if (!hasSession) return <GuestButtons />;
  return (
    <Button asChild size="lg" className="h-10 px-5 text-sm font-semibold">
      <Link href="/dashboard">Buka Dashboard</Link>
    </Button>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:h-[72px]">
        <Link href="/" aria-label="Kerjalin — beranda">
          <Logo />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={`/${l.href}`}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-navy/80 transition-colors hover:bg-accent hover:text-navy"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Suspense fallback={<GuestButtons />}>
            <AuthButtons />
          </Suspense>
        </div>

        <MobileNav links={navLinks} />
      </div>
    </header>
  );
}
