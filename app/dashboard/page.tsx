import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Banknote, Network, ReceiptText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WalletTypeBadge } from "@/components/app/badges";
import { StackedBarChart } from "@/components/app/charts";
import { PageHeader, StatCard } from "@/components/app/page-header";
import { AgentStatusBanner } from "@/components/agent/status-banner";
import { ReferralCard } from "@/components/agent/referral-card";
import { siteConfig } from "@/lib/config";
import { formatDateTime, formatIDR, formatPercent } from "@/lib/format";
import { getAgentOverview } from "@/lib/queries/agent";
import { requireAgent } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ringkasan" };

export default async function AgentOverviewPage() {
  const { user, agent, level } = await requireAgent();
  const o = await getAgentOverview(agent, level);
  const refLink = `${siteConfig.url}/r/${agent.referralCode}`;
  const slotPct = o.slots ? Math.min(100, (o.team.direct / o.slots) * 100) : 0;
  const canRecruit = Boolean(level.downlineLevelId) && (o.slots === null || o.slots > 0);

  return (
    <>
      <PageHeader
        title={`Halo, ${user.name.split(" ")[0]}`}
        description={`Level ${level.name} · komisi penjualan ${formatPercent(o.commissionPercent)}`}
      />
      <AgentStatusBanner status={agent.status} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="relative overflow-hidden border-0 bg-navy p-6 text-white sm:p-8">
          <div className="absolute -top-20 -right-10 size-72 rounded-full bg-brand/35 blur-3xl" aria-hidden />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-cream/70">
                <Wallet className="size-4" /> Saldo tersedia
              </p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
                {formatIDR(o.wallet.balance)}
              </p>
              <p className="mt-2 text-sm text-cream/70">
                {o.wallet.pendingWithdrawal > 0
                  ? `${formatIDR(o.wallet.pendingWithdrawal)} sedang diproses admin`
                  : `Sudah ditarik ${formatIDR(o.wallet.paidWithdrawal)}`}
              </p>
            </div>
            <Button asChild size="lg" className="h-11 bg-white font-bold text-navy hover:bg-cream">
              <Link href="/dashboard/penarikan">
                <Banknote /> Tarik dana
              </Link>
            </Button>
          </div>
        </Card>

        <ReferralCard
          link={refLink}
          code={agent.referralCode}
          slotText={canRecruit ? (o.slots === null ? "Slot tak terbatas" : `${o.team.direct}/${o.slots} slot terpakai`) : undefined}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Komisi bulan ini" value={formatIDR(o.monthEarned)} icon={Banknote} tone="green" />
        <StatCard
          label="Total komisi"
          value={formatIDR(o.wallet.earned)}
          hint="Sejak bergabung"
          icon={Wallet}
        />
        <StatCard
          label="Penjualan lunas"
          value={o.sales.paid}
          hint={o.sales.pending ? `${o.sales.pending} menunggu pembayaran` : `Omzet ${formatIDR(o.sales.revenue)}`}
          icon={ReceiptText}
          tone="navy"
        />
        <StatCard
          label="Tim saya"
          value={`${o.team.direct} langsung`}
          hint={`${o.team.total} agen di seluruh downline`}
          icon={Network}
          tone="violet"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan 30 hari terakhir</CardTitle>
            <CardDescription>Komisi penjualan dan bonus tim per hari.</CardDescription>
          </CardHeader>
          <CardContent>
            <StackedBarChart
              data={o.daily}
              series={[
                { key: "commission", label: "Komisi penjualan", color: "var(--chart-1)" },
                { key: "bonus", label: "Bonus tim", color: "var(--chart-3)" },
              ]}
            />
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas terbaru</CardTitle>
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/komisi">
                  Semua <ArrowUpRight />
                </Link>
              </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-3.5">
              {o.recent.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Belum ada aktivitas. Bagikan tautan referralmu untuk mulai.
                </p>
              )}
              {o.recent.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <WalletTypeBadge type={e.type} />
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{e.description}</p>
                    <p className="text-[0.7rem] text-muted-foreground/80">{formatDateTime(e.createdAt)}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-bold tabular-nums",
                      e.amount >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {e.amount >= 0 ? "+" : "−"}
                    {formatIDR(Math.abs(e.amount))}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {canRecruit && (
            <Card>
              <CardHeader>
                <CardTitle>Kapasitas tim</CardTitle>
                <CardDescription>
                  Agen yang kamu ajak akan menjadi level yang ditentukan Kerjalin.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-navy">{o.team.direct}</span>
                  <span className="text-sm text-muted-foreground">dari {o.slots ?? "∞"} slot</span>
                </div>
                {o.slots !== null && <Progress value={slotPct} className="h-2" />}
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/dashboard/tim">Lihat tim saya</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
