import type { Metadata } from "next";
import Image from "next/image";
import { Boxes, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/badges";
import { CopyButton } from "@/components/app/copy-button";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { siteConfig } from "@/lib/config";
import { formatIDR, formatPercent } from "@/lib/format";
import { effectiveCommission } from "@/lib/mlm";
import { getAgentCatalog } from "@/lib/queries/agent";
import { requireAgent } from "@/lib/session";

export const metadata: Metadata = { title: "Katalog produk" };

export default async function CatalogPage() {
  const { agent, level } = await requireAgent();
  const items = await getAgentCatalog(agent, level);
  const pct = effectiveCommission(agent, level);

  return (
    <>
      <PageHeader
        title="Katalog produk"
        description={`Produk yang bisa kamu tawarkan. Komisimu ${formatPercent(pct)} dari total setiap langganan. Bagikan link jual agar pesanan pelanggan dicatat atas namamu.`}
      />

      {items.length === 0 ? (
        <EmptyState icon={Boxes} title="Belum ada produk" description="Produk baru akan segera ditambahkan oleh admin." />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border">
          {items.map((p) => {
            const pageLink = `${siteConfig.url}/produk/${p.slug}`;
            // Tautan jual: menyimpan kode referralmu lalu membuka halaman produk, sehingga pesanan dicatat atas namamu.
            const link = `${siteConfig.url}/r/${agent.referralCode}?to=/produk/${p.slug}`;
            const caption = `${p.name}: ${p.tagline ?? ""}\nMulai ${formatIDR(p.priceMonthly)}/bulan.\nInfo lengkap dan pesan di sini: ${link}`;
            const plans = p.pricingPlans.length
              ? p.pricingPlans.map((pl) => ({ label: pl.label || `${pl.months} bulan`, price: pl.price }))
              : [{ label: "Bulanan", price: p.priceMonthly }];
            return (
              <li key={p.id} className="grid gap-5 border-t border-border bg-card p-5 first:border-t-0 md:grid-cols-[168px_minmax(0,1fr)_auto]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted md:aspect-auto md:h-[126px]">
                  {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="168px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h2 className="text-[1.0625rem] font-semibold text-navy">{p.name}</h2>
                    {p.status === "coming_soon" && <StatusBadge tone="navy">Segera hadir</StatusBadge>}
                  </div>
                  <p className="text-[0.8125rem] text-muted-foreground">{p.categoryName ?? "Tanpa kategori"}</p>
                  {p.tagline && <p className="mt-1.5 text-[0.9375rem] text-navy/80">{p.tagline}</p>}
                  <table className="mt-3 w-full max-w-md text-[0.9375rem]">
                    <thead>
                      <tr className="text-left text-[0.8125rem] text-muted-foreground">
                        <th className="pb-1 font-medium">Paket</th>
                        <th className="pb-1 text-right font-medium">Harga</th>
                        <th className="pb-1 text-right font-medium">Komisimu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((pl) => (
                        <tr key={pl.label} className="border-t border-rule">
                          <td className="py-1.5">{pl.label}</td>
                          <td className="py-1.5 text-right tabular-nums">{formatIDR(pl.price)}</td>
                          <td className="py-1.5 text-right font-semibold tabular-nums text-positive">
                            {formatIDR(Math.floor((pl.price * pct) / 100))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-row gap-2 md:flex-col md:items-stretch">
                  <CopyButton value={link} label="Salin link jual" successMessage="Link jual disalin" variant="default" />
                  <CopyButton value={caption} label="Salin teks promosi" successMessage="Teks promosi disalin" />
                  <Button asChild variant="outline" size="sm">
                    <a href={pageLink} target="_blank" rel="noreferrer">
                      <ExternalLink /> Halaman produk
                    </a>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
