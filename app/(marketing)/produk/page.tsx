import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { Pagination } from "@/components/app/pagination";
import {
  CategoryChips,
  CategoryList,
  RefineFilters,
  SearchBar,
  catalogHref,
  type CatalogQuery,
} from "@/components/marketing/catalog-filters";
import { loadPublicLevels, topCommissionOf } from "@/components/marketing/levels-section";
import { ProductCard } from "@/components/marketing/product-card";
import { Reveal } from "@/components/marketing/reveal";
import { Rise } from "@/components/marketing/rise";
import { SortSelect } from "@/components/marketing/sort-select";
import { Skeleton } from "@/components/ui/skeleton";
import { fallbackProducts } from "@/lib/content";
import { PRODUCT_SORTS, getCatalogFacets, listPublicProducts, type ProductSort } from "@/lib/queries/catalog";
import { first, pageParam, pickEnum } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Semua Produk",
  description: "Daftar produk dan layanan digital Kerjalin untuk UMKM. Cari, saring, dan bandingkan harga serta komisi agen.",
};

const PAGE_SIZE = 9;

export default function ProductsPage(props: PageProps<"/produk">) {
  return (
    <>
      <header className="border-b border-border bg-gradient-to-b from-muted to-white">
        <div className="mx-auto w-full max-w-[1240px] px-4 pt-8 pb-8 sm:px-6 lg:px-8 lg:pt-12">
          <Rise y={10}>
            <nav aria-label="Jejak halaman" className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-navy hover:underline">
                Beranda
              </Link>
              <ChevronRight className="size-4" aria-hidden />
              <span className="font-semibold text-navy">Produk</span>
            </nav>
          </Rise>
          <Rise delay={0.05}>
            <h1 className="mt-4 text-[clamp(2rem,4.4vw,3rem)] leading-tight font-extrabold text-navy">Semua Produk</h1>
            <p className="mt-2 max-w-[56ch] text-muted-foreground">
              Temukan produk terbaik untuk kamu tawarkan. Bandingkan harga, paket, dan komisi yang bisa kamu dapat.
            </p>
          </Rise>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1240px] px-4 pt-8 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <Suspense fallback={<ListSkeleton />}>
          <Catalog searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Catalog({ searchParams }: { searchParams: PageProps<"/produk">["searchParams"] }) {
  const sp = await searchParams;
  const sortKeys = Object.keys(PRODUCT_SORTS) as ProductSort[];
  const query: CatalogQuery = {
    q: first(sp.q),
    kategori: first(sp.kategori),
    tersedia: pickEnum(sp.tersedia, ["active", "coming_soon"] as const),
    min: Number(first(sp.min)) || undefined,
    max: Number(first(sp.max)) || undefined,
    urut: pickEnum(sp.urut, sortKeys),
    hal: pageParam(sp.hal),
  };

  const [result, facets, levels] = await Promise.all([
    listPublicProducts({
      q: query.q,
      category: query.kategori,
      availability: query.tersedia,
      min: query.min,
      max: query.max,
      sort: query.urut as ProductSort | undefined,
      page: query.hal,
      pageSize: PAGE_SIZE,
    }),
    getCatalogFacets(),
    loadPublicLevels(),
  ]);

  const topCommission = topCommissionOf(levels);
  const dbEmpty = facets.total === 0;
  const activeSort = (query.urut as ProductSort | undefined) ?? "unggulan";
  const activeCategory = facets.categories.find((c) => c.slug === query.kategori);
  const filterParams = {
    q: query.q,
    kategori: query.kategori,
    tersedia: query.tersedia,
    min: query.min ? String(query.min) : undefined,
    max: query.max ? String(query.max) : undefined,
    urut: query.urut,
  };
  const sortOptions = sortKeys.map((k) => ({
    value: k,
    label: PRODUCT_SORTS[k],
    href: catalogHref(query, { urut: k === "unggulan" ? undefined : k }),
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
      <Rise delay={0.1} className="grid gap-6 lg:col-span-2">
        <SearchBar query={query} facets={facets} />
        <CategoryChips query={query} facets={facets} />
      </Rise>

      <aside aria-label="Filter produk" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <p className="mb-3 text-sm font-bold text-navy">Kategori</p>
        <CategoryList query={query} facets={facets} />
        <div className="mt-7 border-t border-border pt-7">
          <RefineFilters query={query} facets={facets} />
        </div>
      </aside>

      <section aria-label="Daftar produk" className="min-w-0">
        <Rise delay={0.15} y={10} className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" role="status">
            <span className="font-bold text-navy tabular-nums">{result.total}</span> produk
            {activeCategory && (
              <>
                {" "}
                di <span className="font-semibold text-navy">{activeCategory.name}</span>
              </>
            )}
            {query.q && (
              <>
                {" "}
                untuk “{query.q}”
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <details className="group relative lg:hidden">
              <summary className="inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-input bg-white px-4 text-sm font-semibold text-navy [&::-webkit-details-marker]:hidden">
                <SlidersHorizontal className="size-4" aria-hidden />
                Filter
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-[min(88vw,320px)] rounded-2xl border border-border bg-white p-5 shadow-float">
                <RefineFilters query={query} facets={facets} />
              </div>
            </details>
            <SortSelect value={activeSort} options={sortOptions} />
          </div>
        </Rise>

        {result.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-input bg-muted px-6 py-16 text-center">
            <p className="text-xl font-bold text-navy">{dbEmpty ? "Produk akan segera hadir." : "Tidak ada produk yang cocok."}</p>
            <p className="mx-auto mt-2 max-w-[44ch] text-sm text-muted-foreground">
              {dbEmpty
                ? `Contoh: ${fallbackProducts.map((p) => p.name).join(", ")}. Daftar jadi agen agar siap berjualan begitu dibuka.`
                : "Coba ubah kata kunci, rentang harga, atau hapus beberapa filter."}
            </p>
            <Link
              href={dbEmpty ? "/daftar" : "/produk"}
              className="mt-6 inline-flex h-12 items-center rounded-xl bg-navy px-6 text-sm font-semibold text-white transition-colors hover:bg-navy-soft"
            >
              {dbEmpty ? "Daftar Sekarang" : "Hapus semua filter"}
            </Link>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((p, i) => (
              <li key={p.id}>
                <Reveal delay={(i % 3) * 0.06} y={16} className="h-full">
                  <ProductCard product={p} topCommission={topCommission} priority={i < 3} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            basePath="/produk"
            pageKey="hal"
            noun="produk"
            params={filterParams}
          />
        </div>
      </section>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
      <Skeleton className="h-16 rounded-2xl lg:col-span-2" />
      <Skeleton className="hidden h-96 rounded-2xl lg:block" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[400px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
