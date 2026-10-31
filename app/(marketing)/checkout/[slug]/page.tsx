import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Rise } from "@/components/marketing/rise";
import { Skeleton } from "@/components/ui/skeleton";
import { REF_COOKIE } from "@/lib/config";
import { displayPlans } from "@/lib/pricing";
import { getProductBySlug } from "@/lib/queries/catalog";
import { lookupSeller } from "@/lib/queries/public";
import { first } from "@/lib/search-params";
import { getAgentByUserId, getSession } from "@/lib/session";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Pesan",
  robots: { index: false, follow: false },
};

export default function CheckoutPage(props: PageProps<"/checkout/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pt-10 lg:pb-32">
      <Suspense fallback={<CheckoutSkeleton />}>
        <Content params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({
  params,
  searchParams,
}: {
  params: PageProps<"/checkout/[slug]">["params"];
  searchParams: PageProps<"/checkout/[slug]">["searchParams"];
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const plans = displayPlans(product);
  const wanted = Number(first(sp.paket));
  const initialMonths = plans.find((p) => p.months === wanted)?.months ?? plans[0].months;

  const [seller, session] = await Promise.all([lookupSeller((await cookies()).get(REF_COOKIE)?.value), getSession()]);
  const profile = session && session.user.role !== "super_admin" ? await getAgentByUserId(session.user.id) : null;

  return (
    <>
      <Rise y={10}>
        <nav aria-label="Jejak halaman" className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
          <Link href="/produk" className="hover:text-navy hover:underline">
            Produk
          </Link>
          <ChevronRight className="size-4" aria-hidden />
          <Link href={`/produk/${product.slug}`} className="hover:text-navy hover:underline">
            {product.name}
          </Link>
          <ChevronRight className="size-4" aria-hidden />
          <span className="font-semibold text-navy">Pesan</span>
        </nav>
        <h1 className="mb-8 text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight font-extrabold text-navy">Pesan {product.name}</h1>
      </Rise>

      <Rise delay={0.08}>
        <CheckoutForm
          product={{
            slug: product.slug,
            name: product.name,
            tagline: product.tagline,
            categoryName: product.categoryName,
            imageUrl: product.imageUrl,
            soon: product.status === "coming_soon",
            releaseNote: product.releaseNote,
          }}
          plans={plans}
          initialMonths={initialMonths}
          seller={seller ? { name: seller.name, code: seller.code } : null}
          selfAgent={profile?.agent.status === "active"}
        />
      </Rise>
    </>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid gap-6">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
