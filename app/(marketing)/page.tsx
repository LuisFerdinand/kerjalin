import { Suspense } from "react";
import { AudienceSection } from "@/components/marketing/audience-section";
import { BenefitStrip } from "@/components/marketing/benefit-strip";
import { CommissionSection, loadPublicLevels } from "@/components/marketing/commission-section";
import { CtaBand } from "@/components/marketing/cta-band";
import { EarningsSimulator } from "@/components/marketing/earnings-simulator";
import { FaqSection } from "@/components/marketing/faq-section";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ProductsSection } from "@/components/marketing/products-section";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BenefitStrip />
      <Suspense fallback={<SectionSkeleton />}>
        <ProductsSection />
      </Suspense>
      <HowItWorks />
      <Suspense fallback={<SectionSkeleton />}>
        <CommissionAndSimulator />
      </Suspense>
      <AudienceSection />
      <FaqSection />
      <CtaBand />
    </>
  );
}

async function CommissionAndSimulator() {
  const levels = await loadPublicLevels();
  return (
    <>
      <CommissionSection levels={levels} />
      <EarningsSimulator levels={levels} />
    </>
  );
}

function SectionSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <Skeleton className="mx-auto h-10 w-80" />
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
