import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, Headphones, Link2, MessageCircle, Settings2, Wallet } from "lucide-react";
import { CopyButton } from "@/components/app/copy-button";
import { FaqTiles } from "@/components/marketing/faq-tiles";
import { loadPublicLevels, topCommissionOf, type PublicLevel } from "@/components/marketing/levels-section";
import { PlanPicker } from "@/components/marketing/plan-picker";
import { ProductCard } from "@/components/marketing/product-card";
import { ProductGallery } from "@/components/marketing/product-gallery";
import { Reveal } from "@/components/marketing/reveal";
import { Rise } from "@/components/marketing/rise";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig, whatsappLink } from "@/lib/config";
import { formatIDR, formatPercent } from "@/lib/format";
import { effectiveCommission } from "@/lib/mlm";
import { displayPlans } from "@/lib/pricing";
import { getProductBySlug, getRelatedProducts, type CatalogProduct } from "@/lib/queries/catalog";
import { getAgentByUserId, getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

type Props = PageProps<"/produk/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produk tidak ditemukan" };
  const description = product.seoDescription ?? product.tagline ?? undefined;
  return {
    title: product.seoTitle ?? product.name,
    description,
    alternates: { canonical: `/produk/${product.slug}` },
    openGraph: { title: product.seoTitle ?? product.name, description, images: product.imageUrl ? [product.imageUrl] : undefined },
  };
}

export default function ProductDetailPage({ params }: Props) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pt-10 lg:pb-32">
      <Suspense fallback={<DetailSkeleton />}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section id={id} className="scroll-mt-36 pt-12 lg:pt-16">
        <h2 className="text-2xl font-extrabold text-navy">{title}</h2>
        <div className="mt-5">{children}</div>
      </section>
    </Reveal>
  );
}

const benefits = [
  { icon: Link2, title: "Link referral siap pakai", text: "Satu tautan untuk dibagikan ke pelanggan." },
  { icon: Wallet, title: "Komisi otomatis", text: "Dihitung dan masuk ke saldo tiap penjualan lunas." },
  { icon: Headphones, title: "Dukungan tim", text: "Tim Kerjalin membantu lewat WhatsApp." },
];

async function Detail({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, levels] = await Promise.all([getRelatedProducts(product.id, product.categoryId, 3), loadPublicLevels()]);
  const plans = displayPlans(product);
  const images = [product.imageUrl, ...product.gallery].filter((u): u is string => Boolean(u));
  const soon = product.status === "coming_soon";
  const topCommission = topCommissionOf(levels);
  const paragraphs = (product.description ?? "").split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);

  const tabs = [
    paragraphs.length > 0 && { id: "tentang", label: "Tentang" },
    product.features.length > 0 && { id: "fitur", label: "Fitur" },
    product.specs.length > 0 && { id: "spesifikasi", label: "Spesifikasi" },
    product.faqs.length > 0 && { id: "faq", label: "Pertanyaan" },
  ].filter((t): t is { id: string; label: string } => Boolean(t));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline ?? product.description ?? undefined,
    sku: product.sku ?? undefined,
    image: images.map((u) => (u.startsWith("http") ? u : `${siteConfig.url}${u}`)),
    category: product.categoryName ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "IDR",
      price: product.priceMonthly,
      availability: soon ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      url: `${siteConfig.url}/produk/${product.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Rise y={10}>
        <nav aria-label="Jejak halaman" className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-navy hover:underline">
            Beranda
          </Link>
          <ChevronRight className="size-4" aria-hidden />
          <Link href="/produk" className="hover:text-navy hover:underline">
            Produk
          </Link>
          {product.categoryName && product.categorySlug && (
            <>
              <ChevronRight className="size-4" aria-hidden />
              <Link href={`/produk?kategori=${product.categorySlug}`} className="hover:text-navy hover:underline">
                {product.categoryName}
              </Link>
            </>
          )}
          <ChevronRight className="size-4" aria-hidden />
          <span className="font-semibold text-navy">{product.name}</span>
        </nav>
      </Rise>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
        <Rise delay={0.05} y={20} className="lg:sticky lg:top-24">
          <ProductGallery images={images} name={product.name} />
        </Rise>

        <div>
          <Rise delay={0.1}>
            <div className="flex flex-wrap items-center gap-2">
              {product.categoryName && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-navy">{product.categoryName}</span>
              )}
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  soon ? "bg-warning/15 text-warning" : "bg-positive/15 text-positive",
                )}
              >
                {soon ? `Segera hadir${product.releaseNote ? ` · ${product.releaseNote}` : ""}` : "Tersedia sekarang"}
              </span>
              {product.badge && <span className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">{product.badge}</span>}
            </div>
            <h1 className="mt-4 text-[clamp(1.875rem,3.6vw,2.75rem)] leading-[1.1] font-extrabold text-balance text-navy">{product.name}</h1>
            {product.tagline && <p className="mt-3 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">{product.tagline}</p>}
          </Rise>

          <Rise delay={0.18} className="mt-7">
            <Suspense fallback={<PanelSkeleton />}>
              <PurchasePanel product={product} levels={levels} plans={plans} topCommission={topCommission} />
            </Suspense>
          </Rise>

          <Rise delay={0.26}>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {benefits.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-2xl border border-border p-4">
                  <Icon className="size-5 text-navy" aria-hidden />
                  <p className="mt-3 text-sm font-bold text-navy">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>
          </Rise>
        </div>
      </div>

      {tabs.length > 0 && (
        <nav
          aria-label="Bagian halaman"
          className="no-scrollbar sticky top-[72px] z-20 -mx-4 mt-12 flex gap-1 overflow-x-auto border-b border-border bg-white/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
        >
          {tabs.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="shrink-0 border-b-2 border-transparent px-4 py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-navy hover:text-navy"
            >
              {t.label}
            </a>
          ))}
        </nav>
      )}

      {paragraphs.length > 0 && (
        <Section id="tentang" title="Tentang produk ini">
          <div className="grid max-w-[68ch] gap-4 leading-relaxed text-navy/90">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Section>
      )}

      {product.features.length > 0 && (
        <Section id="fitur" title="Fitur yang kamu dapat">
          <ul className="grid gap-3 sm:grid-cols-2">
            {product.features.map((f) => (
              <li key={f} className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3.5 text-sm font-semibold text-navy">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy text-white">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {product.specs.length > 0 && (
        <Section id="spesifikasi" title="Spesifikasi">
          <dl className="overflow-hidden rounded-2xl border border-border">
            {product.specs.map((s, i) => (
              <div key={s.label} className={cn("grid gap-1 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6", i % 2 === 0 ? "bg-muted" : "bg-white")}>
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
                <dd className="text-sm font-semibold text-navy">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {product.faqs.length > 0 && (
        <Section id="faq" title="Pertanyaan umum">
          <FaqTiles items={product.faqs} group="produk-faq" />
        </Section>
      )}

      {related.length > 0 && (
        <Section id="lainnya" title="Produk lainnya">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} topCommission={topCommission} />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

/** Pilihan paket dan ajakan bertindak. Menyesuaikan diri dengan pengunjung: tamu, agen, atau admin. */
async function PurchasePanel({
  product,
  levels,
  plans,
  topCommission,
}: {
  product: CatalogProduct;
  levels: PublicLevel[];
  plans: ReturnType<typeof displayPlans>;
  topCommission: number;
}) {
  const session = await getSession();
  const user = session?.user ?? null;
  const profile = user && user.role !== "super_admin" ? await getAgentByUserId(user.id) : null;
  const soon = product.status === "coming_soon";
  const wa = whatsappLink(`Halo Kerjalin, saya tertarik dengan produk ${product.name}.`);

  const ownPercent = profile ? effectiveCommission(profile.agent, profile.level) : null;
  const referralUrl = profile ? `${siteConfig.url}/r/${profile.agent.referralCode}?to=/produk/${product.slug}` : null;

  const secondary = cn(
    "inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-input bg-white px-6 text-base font-semibold text-navy transition-colors hover:border-navy",
  );

  return (
    <div className="grid gap-5">
      <PlanPicker
        plans={plans}
        commissionPercent={ownPercent ?? topCommission}
        commissionLabel={profile ? `Komisi kamu (${profile.level.name}, ${formatPercent(ownPercent)})` : `Komisi agen hingga ${formatPercent(topCommission)}`}
        checkoutHref={`/checkout/${product.slug}`}
        ctaLabel={soon ? "Pesan Lebih Awal" : "Pesan Sekarang"}
      />

      {profile && referralUrl ? (
        <div className="grid gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted p-2 pl-4">
            <Link2 className="size-4 shrink-0 text-faint" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{referralUrl.replace(/^https?:\/\//, "")}</span>
            <CopyButton value={referralUrl} label="Salin Link Jual" successMessage="Link jual produk ini tersalin" variant="default" />
          </div>
          <Link href="/dashboard/produk" className={secondary}>
            Lihat produk di dashboard
          </Link>
        </div>
      ) : user?.role === "super_admin" ? (
        <Link href={`/admin/produk/${product.id}`} className={secondary}>
          <Settings2 className="size-5" aria-hidden />
          Kelola produk ini
        </Link>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/daftar"
            className="inline-flex h-14 items-center justify-center rounded-xl bg-navy px-6 text-center text-base font-semibold text-white shadow-float transition-colors hover:bg-navy-soft"
          >
            Jadi Agen, Jual Ini
          </Link>
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className={secondary}>
              <MessageCircle className="size-5" aria-hidden />
              Tanya via WhatsApp
            </a>
          ) : product.demoUrl ? (
            <a href={product.demoUrl} target="_blank" rel="noreferrer" className={secondary}>
              Lihat Demo
            </a>
          ) : (
            <Link href="/#faq" className={secondary}>
              Baca FAQ
            </Link>
          )}
        </div>
      )}

      {!profile && levels.length > 0 && (
        <details className="group rounded-2xl border border-border">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-semibold text-navy [&::-webkit-details-marker]:hidden">
            Komisi tiap level agen
            <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
          </summary>
          <ul className="grid gap-px border-t border-border bg-border text-sm">
            {levels.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-4 bg-white px-5 py-3">
                <span className="text-muted-foreground">
                  {l.name} <span className="text-xs">({formatPercent(l.commissionPercent)})</span>
                </span>
                <span className="font-bold text-navy tabular-nums">{formatIDR(Math.floor((product.priceMonthly * Number(l.commissionPercent)) / 100))}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">Per satu bulan langganan. Pendaftaran agen gratis.</p>
        </details>
      )}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-14 rounded-xl" />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
      <Skeleton className="aspect-[4/3] rounded-2xl" />
      <div className="grid content-start gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-14 w-3/4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
