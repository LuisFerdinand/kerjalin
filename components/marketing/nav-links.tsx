"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavCategory = { name: string; slug: string; count: number };
type NavItem = { href: string; label: string };

const itemClass =
  "relative inline-flex h-10 items-center rounded-lg px-3 text-[0.9375rem] font-semibold text-navy/80 transition-colors hover:bg-muted hover:text-navy";

function isActive(href: string, pathname: string) {
  if (href.includes("#")) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Menu utama desktop. "Produk" membuka daftar kategori saat disorot atau difokuskan. */
export function NavLinks({ links, categories }: { links: NavItem[]; categories: NavCategory[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
      {links.map((l) => {
        const active = isActive(l.href, pathname);
        const cls = cn(itemClass, active && "text-navy after:absolute after:inset-x-3 after:-bottom-[15px] after:h-0.5 after:rounded-full after:bg-navy");

        if (l.href !== "/produk" || categories.length === 0) {
          return (
            <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={cls}>
              {l.label}
            </Link>
          );
        }

        return (
          <div key={l.href} className="group relative">
            <Link href={l.href} aria-current={active ? "page" : undefined} className={cn(cls, "gap-1")}>
              {l.label}
              <ChevronDown className="size-4 transition-transform group-focus-within:rotate-180 group-hover:rotate-180" aria-hidden />
            </Link>
            <div className="invisible absolute top-full left-0 z-50 w-[300px] pt-3 opacity-0 transition duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="rounded-2xl border border-border bg-white p-2 shadow-float">
                <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-faint uppercase">Kategori</p>
                <ul>
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/produk?kategori=${c.slug}`}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-muted"
                      >
                        {c.name}
                        <span className="text-xs font-medium text-faint tabular-nums">{c.count} produk</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/produk"
                  className="mt-1 flex items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-accent"
                >
                  Lihat semua produk
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
