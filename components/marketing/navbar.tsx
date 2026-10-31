import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Logo } from "@/components/brand/logo";
import { navLinks } from "@/lib/content";
import { getCatalogFacets } from "@/lib/queries/catalog";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

const outlineButton =
  "inline-flex h-11 items-center rounded-xl border border-input bg-white px-5 text-[0.9375rem] font-semibold text-navy transition-colors hover:border-navy hover:bg-muted";
const solidButton =
  "inline-flex h-11 items-center rounded-xl bg-navy px-6 text-[0.9375rem] font-semibold text-white shadow-sm transition-colors hover:bg-navy-soft";

function GuestActions() {
  return (
    <>
      <Link href="/masuk" className={outlineButton}>
        Masuk
      </Link>
      <Link href="/daftar" className={solidButton}>
        Daftar Sekarang
      </Link>
    </>
  );
}

/** Cek cepat ada tidaknya cookie sesi (validasi penuh dilakukan di dashboard). */
async function hasSession() {
  return (await cookies()).getAll().some((c) => c.name.endsWith("session_token"));
}

async function Actions() {
  if (!(await hasSession())) return <GuestActions />;
  return (
    <Link href="/dashboard" className={solidButton}>
      Buka dashboard
    </Link>
  );
}

/** Tampilan awal menu selagi kategori dimuat. Tanpa penanda halaman aktif, karena itu butuh pathname. */
function StaticLinks() {
  return (
    <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
      {navLinks.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="inline-flex h-10 items-center rounded-lg px-3 text-[0.9375rem] font-semibold text-navy/80 transition-colors hover:bg-muted hover:text-navy"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

async function loadCategories() {
  const facets = await getCatalogFacets();
  return facets.categories.map((c) => ({ name: c.name, slug: c.slug, count: c.count }));
}

async function DesktopMenu() {
  return <NavLinks links={navLinks} categories={await loadCategories()} />;
}

async function MobileMenu() {
  const [categories, signedIn] = await Promise.all([loadCategories(), hasSession()]);
  return <MobileNav links={navLinks} categories={categories} signedIn={signedIn} />;
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1240px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Kerjalin, beranda" className="shrink-0">
          <Logo />
        </Link>

        <Suspense fallback={<StaticLinks />}>
          <DesktopMenu />
        </Suspense>

        <div className="hidden items-center gap-2 lg:flex">
          <Suspense fallback={<GuestActions />}>
            <Actions />
          </Suspense>
        </div>

        <Suspense fallback={<MobileNav links={navLinks} categories={[]} signedIn={false} />}>
          <MobileMenu />
        </Suspense>
      </div>
    </header>
  );
}
