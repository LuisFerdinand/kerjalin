import type { Metadata } from "next";
import Image from "next/image";
import { Boxes, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/app/copy-button";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { siteConfig } from "@/lib/config";
import { formatIDR, formatPercent } from "@/lib/format";
import { effectiveCommission } from "@/lib/mlm";
import { getAgentCatalog } from "@/lib/queries/agent";
import { requireAgent } from "@/lib/session";

export const metadata: Metadata = { title: "Katalog Produk" };

export default async function CatalogPage() {
  const { agent, level } = await requireAgent();
  const items = await getAgentCatalog(agent, level);
  const pct = effectiveCommission(agent, level);

  return (
    <>
      <PageHeader
        title="Katalog Produk"
        description={`Layanan yang bisa kamu tawarkan. Komisimu ${formatPercent(pct)} dari setiap langganan.`}
      />

      {items.length === 0 ? (
        <EmptyState icon={Boxes} title="Belum ada produk" description="Produk baru akan segera ditambahkan oleh admin." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => {
            const link = `${siteConfig.url}/produk/${p.slug}`;
            const caption = `${p.name} — ${p.tagline ?? ""}\nMulai ${formatIDR(p.priceMonthly)}/bulan.\nInfo lengkap: ${link}`;
            return (
              <Card key={p.id} className="gap-0 overflow-hidden p-0">
                <div className="relative aspect-[16/9] bg-muted">
                  {p.imageUrl && (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1280px) 420px, (min-width: 640px) 45vw, 100vw"
                      className="object-cover"
                    />
                  )}
                  {p.status === "coming_soon" && (
                    <Badge className="absolute top-3 left-3 gap-1 bg-navy text-cream hover:bg-navy">
                      <Clock className="size-3" /> Segera hadir
                    </Badge>
                  )}
                </div>
                <div className="grid gap-4 p-5">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{p.category}</p>
                    <h3 className="text-lg font-extrabold text-navy">{p.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.tagline}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/70 p-3">
                      <p className="text-xs text-muted-foreground">Harga / bulan</p>
                      <p className="font-extrabold text-navy tabular-nums">{formatIDR(p.priceMonthly)}</p>
                    </div>
                    <div className="rounded-xl bg-success/10 p-3">
                      <p className="text-xs text-success">Komisimu / bulan</p>
                      <p className="font-extrabold text-success tabular-nums">{formatIDR(p.commission)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CopyButton value={caption} label="Salin teks promosi" successMessage="Teks promosi disalin" />
                    <Button asChild variant="outline" size="sm">
                      <a href={link} target="_blank" rel="noreferrer">
                        <ExternalLink /> Halaman produk
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
