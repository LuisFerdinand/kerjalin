"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NAV, type Variant } from "./nav";

const SECTION_LABELS: Record<string, string> = {
  admin: "Panel admin",
  dashboard: "Portal agen",
  pohon: "Pohon jaringan",
  agen: "Agen",
  level: "Level & komisi",
  produk: "Produk",
  kategori: "Kategori",
  pesanan: "Pesanan",
  penarikan: "Penarikan",
  tim: "Tim saya",
  penjualan: "Penjualan",
  komisi: "Riwayat komisi",
  profil: "Profil & rekening",
  baru: "Produk baru",
};

function crumbs(pathname: string | null, variant: Variant) {
  const root = variant === "admin" ? "Panel admin" : "Portal agen";
  const fallback = variant === "admin" ? "Ringkasan" : "Beranda";
  if (!pathname) return { title: fallback, trail: root };
  const parts = pathname.split("/").filter(Boolean).slice(1);
  const labels = parts.map((p, i) => SECTION_LABELS[p] ?? (i > 0 ? "Detail" : p));
  if (labels.length === 0) return { title: fallback, trail: root };
  return { title: labels[labels.length - 1], trail: [root, ...labels.slice(0, -1)].join(" / ") };
}

function Heading({ variant }: { variant: Variant }) {
  const { title, trail } = crumbs(usePathname(), variant);
  return (
    <div className="min-w-0 leading-tight">
      <p className="truncate text-lg font-bold text-navy">{title}</p>
      <p className="hidden truncate text-[0.8125rem] text-muted-foreground sm:block">{trail}</p>
    </div>
  );
}

/** Pencarian cepat ke halaman mana pun di panel. Ctrl+K membukanya. */
function QuickSearch({ variant }: { variant: Variant }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Cari halaman"
        className="ml-auto flex h-10 items-center gap-2 rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground transition-colors hover:border-navy/40 sm:w-60 md:ml-0"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden flex-1 text-left sm:inline">Cari halaman…</span>
        <kbd className="hidden rounded-md border border-border bg-white px-1.5 py-0.5 text-[0.6875rem] font-semibold text-faint sm:inline">Ctrl K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Cari halaman" description="Ketik nama halaman lalu tekan Enter.">
        <CommandInput placeholder="Cari halaman…" />
        <CommandList>
          <CommandEmpty>Halaman tidak ditemukan.</CommandEmpty>
          {NAV[variant].map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem key={item.href} value={`${group.label} ${item.label}`} onSelect={() => go(item.href)}>
                  <item.icon aria-hidden />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export function AppTopbar({ variant }: { variant: Variant }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-white/90 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1 text-navy md:hidden" />
      <Suspense fallback={<span className="text-lg font-bold text-navy">Kerjalin</span>}>
        <Heading variant={variant} />
      </Suspense>
      <div className="ml-auto flex items-center gap-2">
        <QuickSearch variant={variant} />
        <Link
          href="/"
          target="_blank"
          aria-label="Lihat situs"
          title="Lihat situs"
          className="grid size-10 place-items-center rounded-xl border border-border text-navy transition-colors hover:border-navy/40 hover:bg-muted"
        >
          <ExternalLink className="size-4" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
