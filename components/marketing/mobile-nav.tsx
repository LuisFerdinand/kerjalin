"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Buka menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] gap-0 p-0">
        <SheetHeader className="border-b p-5">
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav className="grid gap-1 p-3" aria-label="Navigasi seluler">
          {links.map((l) => (
            <a
              key={l.href}
              href={`/${l.href}`}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-navy hover:bg-accent"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto grid gap-2 border-t p-4">
          <Button asChild variant="outline" size="lg" className="h-11">
            <Link href="/masuk">Masuk</Link>
          </Button>
          <Button asChild size="lg" className="h-11">
            <Link href="/daftar">Daftar Sekarang</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
