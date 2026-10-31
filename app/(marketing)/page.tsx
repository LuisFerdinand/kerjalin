import { Suspense } from "react";
import { BenefitStrip } from "@/components/marketing/benefit-strip";
import { CategorySection } from "@/components/marketing/category-section";
import { CtaBand } from "@/components/marketing/cta-band";
import { EarningsSimulator } from "@/components/marketing/earnings-simulator";
import { FaqSection } from "@/components/marketing/faq-section";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { LevelTiles, loadPublicLevels, topCommissionOf } from "@/components/marketing/levels-section";
import { ProductsSection } from "@/components/marketing/products-section";
import { Skeleton } from "@/components/ui/skeleton";
import { getCatalogFacets, getPublicProducts } from "@/lib/queries/catalog";

/** Komisi tertinggi dipakai di hero dan kartu produk; dibaca dari level agen yang diatur admin. */
const FALLBACK_TOP_COMMISSION = 50;

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<Hero topCommission={FALLBACK_TOP_COMMISSION} />}>
        <HeroWithLevels />
      </Suspense>
      <BenefitStrip />
      <Suspense fallback={<SectionSkeleton />}>
        <Storefront />
      </Suspense>
      <HowItWorks />
      <Suspense fallback={<SectionSkeleton />}>
        <LevelsAndSimulator />
      </Suspense>
      <FaqSection />
      <CtaBand />
    </>
  );
}

async function HeroWithLevels() {
  const levels = await loadPublicLevels();
  return <Hero topCommission={topCommissionOf(levels)} />;
}

async function Storefront() {
  const [facets, levels] = await Promise.all([getCatalogFacets(), loadPublicLevels()]);
  const topCommission = topCommissionOf(levels);
  return (
    <>
      <CategorySection categories={facets.categories} />
      <ProductsSection topCommission={topCommission} />
    </>
  );
}

async function LevelsAndSimulator() {
  const [levels, products] = await Promise.all([loadPublicLevels(), getPublicProducts(1)]);
  const price = products[0]?.priceMonthly ?? 100_000;
  return (
    <>
      <LevelTiles levels={levels} />
      <EarningsSimulator levels={levels} price={price} />
    </>
  );
}

function SectionSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="mt-8 h-72 rounded-2xl" />
    </div>
  );
}
