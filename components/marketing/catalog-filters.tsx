import Link from "next/link";
import {
  Boxes,
  BriefcaseBusiness,
  CalendarCheck,
  Check,
  ChevronDown,
  LayoutGrid,
  Palette,
  Search,
  Shirt,
  Store,
  Tag,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

export type CatalogQuery = {
  q?: string;
  kategori?: string;
  tersedia?: "active" | "coming_soon";
  min?: number;
  max?: number;
  urut?: string;
  hal?: number;
};

/** Susun URL katalog dari parameter saat ini, dengan perubahan. Mengubah filter selalu kembali ke halaman 1. */
export function catalogHref(current: CatalogQuery, change: Partial<Record<keyof CatalogQuery, string | number | undefined>>) {
  const merged: Record<string, string | number | undefined> = { ...current, hal: undefined, ...change };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "" && v !== 0) sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `/produk?${qs}` : "/produk";
}

export type CatalogFacets = {
  categories: { id: string; name: string; slug: string; count: number }[];
  minPrice: number;
  maxPrice: number;
  active: number;
  comingSoon: number;
  total: number;
};

/** Ikon kategori berdasarkan slug. Kategori baru dari admin memakai ikon label. */
const ICONS: Record<string, LucideIcon> = {
  laundry: Shirt,
  "kasir-toko": Store,
  kuliner: UtensilsCrossed,
  "jasa-booking": CalendarCheck,
  "bisnis-keuangan": BriefcaseBusiness,
  "digital-kreatif": Palette,
};

export function categoryIcon(slug: string): LucideIcon {
  return ICONS[slug] ?? Tag;
}

/** Kolom pencarian di bagian atas halaman produk, lengkap dengan pilihan kategori. */
export function SearchBar({ query, facets }: { query: CatalogQuery; facets: CatalogFacets }) {
  return (
    <form action="/produk" role="search" className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-2 shadow-card sm:flex-row">
      {query.tersedia && <input type="hidden" name="tersedia" value={query.tersedia} />}
      {query.urut && <input type="hidden" name="urut" value={query.urut} />}
      <label htmlFor="plp-q" className="sr-only">
        Cari produk
      </label>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-faint" aria-hidden />
        <input
          id="plp-q"
          name="q"
          defaultValue={query.q}
          placeholder="Cari produk, mis. laundry atau kasir"
          className="h-12 w-full rounded-xl bg-transparent pr-3 pl-12 text-[0.9375rem] text-navy outline-none placeholder:text-faint focus-visible:ring-3 focus-visible:ring-navy/20"
        />
      </div>
      <div className="relative sm:w-56">
        <label htmlFor="plp-kategori" className="sr-only">
          Kategori
        </label>
        <select
          id="plp-kategori"
          name="kategori"
          defaultValue={query.kategori ?? ""}
          className="h-12 w-full appearance-none rounded-xl border border-border bg-muted pr-10 pl-4 text-sm font-semibold text-navy outline-none focus-visible:ring-3 focus-visible:ring-navy/20"
        >
          <option value="">Semua Kategori</option>
          {facets.categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-navy" aria-hidden />
      </div>
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy px-7 text-sm font-semibold text-white transition-colors hover:bg-navy-soft"
      >
        <Search className="size-4" aria-hidden />
        Cari
      </button>
    </form>
  );
}

function SideLink({
  href,
  active,
  icon: Icon,
  count,
  children,
}: {
  href: string;
  active: boolean;
  icon?: LucideIcon;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
        active ? "bg-navy text-white shadow-sm" : "text-navy/80 hover:bg-muted hover:text-navy",
      )}
    >
      {Icon && <Icon className="size-[18px] shrink-0" aria-hidden />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count !== undefined && <span className={cn("text-xs font-medium tabular-nums", active ? "text-white/80" : "text-faint")}>{count}</span>}
    </Link>
  );
}

/** Daftar kategori di sisi kiri. */
export function CategoryList({ query, facets }: { query: CatalogQuery; facets: CatalogFacets }) {
  return (
    <nav aria-label="Kategori produk" className="grid gap-1">
      <SideLink href={catalogHref(query, { kategori: undefined })} active={!query.kategori} icon={LayoutGrid} count={facets.total}>
        Semua Produk
      </SideLink>
      {facets.categories.map((c) => (
        <SideLink key={c.id} href={catalogHref(query, { kategori: c.slug })} active={query.kategori === c.slug} icon={categoryIcon(c.slug)} count={c.count}>
          {c.name}
        </SideLink>
      ))}
    </nav>
  );
}

/** Deretan kategori yang bisa digeser, untuk ponsel. */
export function CategoryChips({ query, facets }: { query: CatalogQuery; facets: CatalogFacets }) {
  const chip = (active: boolean) =>
    cn(
      "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
      active ? "border-navy bg-navy text-white" : "border-input bg-white text-navy hover:border-navy",
    );
  return (
    <nav aria-label="Kategori produk" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
      <Link href={catalogHref(query, { kategori: undefined })} className={chip(!query.kategori)} aria-current={!query.kategori ? "true" : undefined}>
        Semua
      </Link>
      {facets.categories.map((c) => (
        <Link
          key={c.id}
          href={catalogHref(query, { kategori: c.slug })}
          className={chip(query.kategori === c.slug)}
          aria-current={query.kategori === c.slug ? "true" : undefined}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}

const fieldClass =
  "h-11 w-full rounded-xl border border-input bg-white px-3 text-sm text-navy tabular-nums outline-none focus-visible:border-navy focus-visible:ring-3 focus-visible:ring-navy/20";

/** Ketersediaan dan rentang harga. */
export function RefineFilters({ query, facets }: { query: CatalogQuery; facets: CatalogFacets }) {
  const hasFilters = Boolean(query.q || query.kategori || query.tersedia || query.min || query.max);
  return (
    <div className="grid gap-7">
      <fieldset className="grid gap-1">
        <legend className="mb-2 text-sm font-bold text-navy">Ketersediaan</legend>
        <SideLink href={catalogHref(query, { tersedia: undefined })} active={!query.tersedia}>
          Semua
        </SideLink>
        <SideLink href={catalogHref(query, { tersedia: "active" })} active={query.tersedia === "active"} count={facets.active}>
          Tersedia sekarang
        </SideLink>
        <SideLink href={catalogHref(query, { tersedia: "coming_soon" })} active={query.tersedia === "coming_soon"} count={facets.comingSoon}>
          Segera hadir
        </SideLink>
      </fieldset>

      <form action="/produk" className="grid gap-3">
        {query.q && <input type="hidden" name="q" value={query.q} />}
        {query.kategori && <input type="hidden" name="kategori" value={query.kategori} />}
        {query.tersedia && <input type="hidden" name="tersedia" value={query.tersedia} />}
        {query.urut && <input type="hidden" name="urut" value={query.urut} />}
        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm font-bold text-navy">Harga per bulan</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs text-muted-foreground">
              Dari (Rp)
              <input name="min" type="number" min={0} step={5000} defaultValue={query.min || ""} placeholder={String(facets.minPrice)} className={fieldClass} />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Sampai (Rp)
              <input name="max" type="number" min={0} step={5000} defaultValue={query.max || ""} placeholder={String(facets.maxPrice)} className={fieldClass} />
            </label>
          </div>
          {facets.maxPrice > 0 && (
            <p className="text-xs text-muted-foreground">
              Kisaran {formatIDR(facets.minPrice)} sampai {formatIDR(facets.maxPrice)}.
            </p>
          )}
        </fieldset>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-navy text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
        >
          <Check className="size-4" aria-hidden />
          Terapkan harga
        </button>
      </form>

      {hasFilters && (
        <Link href="/produk" className="inline-flex items-center gap-2 text-sm font-semibold text-navy underline underline-offset-4">
          <Boxes className="size-4" aria-hidden />
          Hapus semua filter
        </Link>
      )}
    </div>
  );
}
