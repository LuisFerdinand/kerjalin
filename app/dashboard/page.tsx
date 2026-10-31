import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  ArrowRight,
  Banknote,
  Boxes,
  Coins,
  Hourglass,
  Link2,
  Package,
  Percent,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { db } from "@/db";
import { agentLevels, type WalletEntryType } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { BarsChart, ChartKey } from "@/components/app/charts";
import {
  ActivityList,
  PendingCards,
  QuickActions,
  RankedList,
  StatCard,
  WelcomeBanner,
  deltaPercent,
  type ActivityItem,
  type PendingItem,
  type Tone,
} from "@/components/app/dash";
import { Panel } from "@/components/app/page-header";
import { AgentStatusBanner } from "@/components/agent/status-banner";
import { ReferralCard } from "@/components/agent/referral-card";
import { SlotStrip } from "@/components/agent/slot-strip";
import { siteConfig } from "@/lib/config";
import { formatCompact, formatIDR, formatPercent, formatRelative, formatToday } from "@/lib/format";
import { getAgentOverview, getSponsorName, getTopProducts } from "@/lib/queries/agent";
import { requireAgent } from "@/lib/session";

export const metadata: Metadata = { title: "Beranda" };

const SERIES = [
  { key: "commission", label: "Komisi penjualan", color: "#082052" },
  { key: "bonus", label: "Bonus tim", color: "#9db0dd" },
];

const WALLET_VISUAL: Record<WalletEntryType, { icon: typeof Coins; tone: Tone }> = {
  commission: { icon: Coins, tone: "teal" },
  override: { icon: Users, tone: "violet" },
  reversal: { icon: ReceiptText, tone: "rose" },
  adjustment: { icon: TrendingUp, tone: "sky" },
  withdrawal: { icon: Banknote, tone: "amber" },
  withdrawal_refund: { icon: Banknote, tone: "navy" },
};

export default async function AgentOverviewPage() {
  const { user, agent, level } = await requireAgent();
  const [o, sponsor, recruitLevel, topProducts] = await Promise.all([
    getAgentOverview(agent, level),
    getSponsorName(agent),
    level.downlineLevelId
      ? db.select().from(agentLevels).where(eq(agentLevels.id, level.downlineLevelId)).limit(1).then((r) => r[0])
      : Promise.resolve(undefined),
    getTopProducts(agent.id),
  ]);
  const refLink = `${siteConfig.url}/r/${agent.referralCode}`;
  const canRecruit = Boolean(recruitLevel) && (o.slots === null || o.slots > 0);

  const finding =
    o.wallet.pendingWithdrawal > 0
      ? `${formatIDR(o.wallet.pendingWithdrawal)} sedang diproses admin.`
      : o.wallet.balance > 0
        ? "Saldo siap ditarik ke rekeningmu."
        : "Bagikan tautan referralmu untuk mulai mengumpulkan komisi.";

  const withdrawnPercent = o.wallet.earned > 0 ? (o.wallet.paidWithdrawal / o.wallet.earned) * 100 : 0;
  const orderTotal = o.sales.paid + o.sales.pending;
  const slotLeft = o.slots === null ? null : Math.max(0, o.slots - o.team.direct);

  const activity: ActivityItem[] = o.recent.map((e) => {
    const visual = WALLET_VISUAL[e.type];
    return {
      id: e.id,
      icon: visual.icon,
      tone: visual.tone,
      title: e.description ?? "Aktivitas dompet",
      time: formatRelative(e.createdAt),
      amount: (
        <span className={e.amount >= 0 ? "text-positive" : "text-negative"}>
          {e.amount >= 0 ? "+" : "−"}
          {formatIDR(Math.abs(e.amount))}
        </span>
      ),
    };
  });

  const pending: PendingItem[] = [
    {
      href: "/dashboard/penjualan",
      icon: ReceiptText,
      tone: "amber",
      count: o.sales.pending,
      title: "Pesanan menunggu",
      text: "Komisi dibagikan otomatis begitu pesanan dinyatakan lunas oleh admin.",
      action: "Lihat penjualan",
    },
    {
      href: "/dashboard/penarikan",
      icon: Hourglass,
      tone: "sky",
      count: o.wallet.pendingWithdrawal > 0 ? `Rp ${formatCompact(o.wallet.pendingWithdrawal)}` : "0",
      title: "Penarikan diproses",
      text: o.wallet.pendingWithdrawal > 0 ? "Admin sedang memproses transfer ke rekeningmu." : "Tidak ada penarikan yang sedang berjalan.",
      action: "Riwayat penarikan",
    },
    canRecruit
      ? {
          href: "/dashboard/tim",
          icon: UserPlus,
          tone: "violet",
          count: slotLeft === null ? "∞" : slotLeft,
          title: "Slot tim tersisa",
          text: `Ajak teman jadi ${recruitLevel?.name ?? "agen"} dan dapatkan bonus tim dari penjualan mereka.`,
          action: "Lihat tim",
        }
      : {
          href: "/dashboard/penarikan",
          icon: Wallet,
          tone: "teal",
          count: `Rp ${formatCompact(o.wallet.balance)}`,
          title: "Saldo siap ditarik",
          text: "Ajukan penarikan ke rekening bank atau e-wallet kapan saja.",
          action: "Tarik dana",
        },
  ];

  return (
    <div className="grid gap-6">
      <WelcomeBanner
        title={`Halo, ${user.name.split(" ")[0]}!`}
        date={formatToday()}
        subtitle={`${level.name} · komisi penjualan ${formatPercent(o.commissionPercent)}. ${finding}`}
        actions={
          <>
            <Button asChild size="lg" className="bg-white text-navy hover:bg-white/90">
              <Link href="/dashboard/penarikan">Tarik dana</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="border border-white/25 text-white hover:bg-white/10 hover:text-white">
              <Link href="/dashboard/produk">Katalog produk</Link>
            </Button>
          </>
        }
        stats={[
          { icon: Percent, label: "Komisi penjualan", value: formatPercent(o.commissionPercent), hint: level.name },
          { icon: Coins, label: "Total komisi", value: formatIDR(o.wallet.earned), hint: "Sejak bergabung" },
          { icon: ShoppingBag, label: "Omzet penjualan", value: formatIDR(o.sales.revenue), hint: `${o.sales.paid} pesanan lunas` },
          { icon: Hourglass, label: "Penarikan diproses", value: formatIDR(o.wallet.pendingWithdrawal), hint: `Sudah ditarik ${formatIDR(o.wallet.paidWithdrawal)}` },
        ]}
      />

      <AgentStatusBanner status={agent.status} />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          tone="navy"
          label="Saldo tersedia"
          value={formatIDR(o.wallet.balance)}
          hint={`Total komisi ${formatIDR(o.wallet.earned)}`}
          progress={{ label: "Sudah ditarik", percent: withdrawnPercent }}
        />
        <StatCard
          icon={TrendingUp}
          tone="sky"
          label="Komisi bulan ini"
          value={formatIDR(o.monthEarned)}
          hint={`Bulan lalu ${formatIDR(o.lastMonthEarned)}`}
          delta={deltaPercent(o.monthEarned, o.lastMonthEarned)}
          progress={o.lastMonthEarned > 0 ? { label: "Dari bulan lalu", percent: (o.monthEarned / o.lastMonthEarned) * 100 } : undefined}
        />
        <StatCard
          icon={ReceiptText}
          tone="teal"
          label="Penjualan lunas"
          value={o.sales.paid}
          hint={o.sales.pending ? `${o.sales.pending} menunggu pembayaran` : `Omzet ${formatIDR(o.sales.revenue)}`}
          progress={orderTotal > 0 ? { label: "Pesanan lunas", percent: (o.sales.paid / orderTotal) * 100 } : undefined}
        />
        <StatCard
          icon={Users}
          tone="violet"
          label="Tim saya"
          value={o.team.total}
          hint={`${o.team.direct} agen langsung`}
          progress={o.slots ? { label: "Slot terpakai", percent: (o.team.direct / o.slots) * 100, right: `${o.team.direct}/${o.slots}` } : undefined}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Panel
          title="Pendapatan 30 hari"
          description={`Total komisi sejak bergabung ${formatIDR(o.wallet.earned)}`}
          action={<ChartKey series={SERIES} />}
        >
          <BarsChart data={o.daily} series={SERIES} className="aspect-auto h-72 w-full" />
        </Panel>

        <ReferralCard link={refLink} code={agent.referralCode} title="Ajak teman jadi agen">
          {canRecruit ? (
            <SlotStrip used={o.team.direct} slots={o.slots} sponsor={sponsor} nextLevel={recruitLevel?.name ?? null} />
          ) : (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              Level {level.name} tidak membuka perekrutan agen baru. Fokus menjual produk untuk mendapat komisi.
            </p>
          )}
        </ReferralCard>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Panel
          title="Aktivitas terbaru"
          description="Komisi, bonus tim, dan penarikan terbaru"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/komisi">
                Semua riwayat <ArrowRight />
              </Link>
            </Button>
          }
        >
          <ActivityList items={activity} empty="Belum ada aktivitas. Setelah ada penjualan atas namamu, komisinya muncul di sini." />
        </Panel>

        <Panel
          title="Produk terlaris"
          description="Dari penjualan lunas atas namamu"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/produk">
                Katalog <ArrowRight />
              </Link>
            </Button>
          }
        >
          <RankedList
            empty="Belum ada penjualan lunas. Produk yang paling laku tampil di sini."
            items={topProducts.map((p, i) => ({
              id: p.name,
              rank: i + 1,
              name: p.name,
              sub: formatIDR(p.revenue),
              value: `${p.sold} terjual`,
              thumb: (
                <span className="relative grid size-11 place-items-center overflow-hidden rounded-xl bg-white text-faint">
                  {p.imageUrl ? <Image src={p.imageUrl} alt="" fill sizes="44px" className="object-cover" /> : <Package className="size-5" />}
                </span>
              ),
            }))}
          />
        </Panel>
      </div>

      <Panel title="Aksi cepat" description="Yang paling sering dipakai agen">
        <QuickActions
          columns={4}
          items={[
            { href: "/dashboard/produk", icon: Boxes, tone: "navy", title: "Katalog produk", text: "Salin link jual per produk" },
            { href: "/dashboard/penarikan", icon: Wallet, tone: "navy", title: "Tarik dana", text: "Ke rekening bank atau e-wallet" },
            { href: "/dashboard/tim", icon: Users, tone: "teal", title: "Tim saya", text: "Pantau downline dan bonus" },
            { href: "/dashboard/profil", icon: Link2, tone: "violet", title: "Profil & rekening", text: "Perbarui data pencairan" },
          ]}
        />
      </Panel>

      <section aria-label="Perlu perhatian">
        <h2 className="mb-3 text-base font-bold text-navy">Perlu perhatian</h2>
        <PendingCards items={pending} />
      </section>
    </div>
  );
}
