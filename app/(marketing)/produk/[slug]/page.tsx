import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { whatsappLink } from "@/lib/config";
import { formatIDR } from "@/lib/format";
import { getProductBySlug } from "@/lib/queries/public";

type Props = PageProps<"/produk/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produk tidak ditemukan" };
  return {
    title: product.name,
    description: product.tagline ?? undefined,
    openGraph: product.imageUrl ? { images: [product.imageUrl] } : undefined,
  };
}

export default function ProductDetailPage({ params }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-16">
      <Link
        href="/produk"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-navy"
      >
        <ArrowLeft className="size-4" /> Semua layanan
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}

async function Detail({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const soon = product.status === "coming_soon";
  const wa = whatsappLink(`Halo Kerjalin, saya tertarik dengan layanan ${product.name}.`);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-xl shadow-navy/10">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{product.category}</Badge>
          {soon && (
            <Badge className="gap-1 bg-navy text-cream hover:bg-navy">
              <Clock className="size-3" /> Segera hadir
            </Badge>
          )}
        </div>
        <h1 className="mt-4 text-4xl font-extrabold text-balance text-navy sm:text-5xl">
          {product.name}
        </h1>
        {product.tagline && <p className="mt-3 text-lg text-navy/70">{product.tagline}</p>}

        <div className="mt-6 rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Harga langganan</p>
          <p className="text-3xl font-extrabold text-navy">
            {formatIDR(product.priceMonthly)}
            <span className="text-base font-medium text-muted-foreground"> / bulan</span>
          </p>
        </div>

        {product.description && (
          <p className="mt-6 leading-relaxed whitespace-pre-line text-navy/80">{product.description}</p>
        )}

        {product.features.length > 0 && (
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {product.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm font-medium text-navy">
                <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-success" />
                {f}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 gap-2 px-6 text-base font-semibold shadow-lg shadow-brand/25">
            <Link href="/daftar">
              Daftar jadi agen & jual layanan ini <ArrowRight className="size-4" />
            </Link>
          </Button>
          {wa && (
            <Button asChild size="lg" variant="outline" className="h-12 gap-2 px-6 text-base font-semibold">
              <a href={wa} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4.5" /> Tanya via WhatsApp
              </a>
            </Button>
          )}
        </div>
        {soon && (
          <p className="mt-4 text-sm text-muted-foreground">
            Layanan ini masih dalam pengembangan. Daftar sekarang agar siap berjualan begitu
            dirilis.
          </p>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <Skeleton className="aspect-[4/3] rounded-3xl" />
      <div className="grid content-start gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-14 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
