"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";
import type { NavCategory } from "./nav-links";

export function MobileNav({
  links,
  categories,
  signedIn,
}: {
  links: { href: string; label: string }[];
  categories: NavCategory[];
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Buka menu">
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] gap-0 overflow-y-auto bg-white p-0">
        <SheetHeader className="p-5">
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav className="grid px-3" aria-label="Navigasi seluler">
          {links.map((l) => (
            <div key={l.href}>
              <Link
                href={l.href}
                onClick={close}
                className="block rounded-xl px-3 py-3 text-[1.0625rem] font-semibold text-navy hover:bg-muted"
              >
                {l.label}
              </Link>
              {l.href === "/produk" && categories.length > 0 && (
                <ul className="mb-1 ml-5 grid border-l border-border pl-3">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/produk?kategori=${c.slug}`}
                        onClick={close}
                        className="block rounded-lg px-3 py-2 text-[0.9375rem] font-medium text-muted-foreground hover:bg-muted hover:text-navy"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
        <div className="mt-auto grid gap-2 p-5">
          {signedIn ? (
            <Button asChild size="lg" className="h-12 rounded-xl">
              <Link href="/dashboard" onClick={close}>
                Buka dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-xl">
                <Link href="/masuk" onClick={close}>
                  Masuk
                </Link>
              </Button>
              <Button asChild size="lg" className="h-12 rounded-xl">
                <Link href="/daftar" onClick={close}>
                  Daftar Sekarang
                </Link>
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
