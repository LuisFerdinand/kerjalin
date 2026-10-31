import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Hourglass,
  Layers,
  PackagePlus,
  Percent,
  ReceiptText,
  ShoppingBag,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LevelBadge, OrderStatusBadge } from "@/components/app/badges";
import { BarsChart, ChartKey } from "@/components/app/charts";
import {
  ActivityList,
  PendingCards,
  QuickActions,
  RankedList,
  StatCard,
  WelcomeBanner,
  type ActivityItem,
  type PendingItem,
  type Tone,
} from "@/components/app/dash";
import { Panel } from "@/components/app/page-header";
import { SplitBar } from "@/components/app/split-bar";
import { formatIDR, formatPercent, formatRelative, formatToday, initials } from "@/lib/format";
import { getAdminOverview } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Ringkasan" };

const SERIES = [
  { key: "admin", label: "Bagian Kerjalin", color: "#082052" },
  { key: "commission", label: "Komisi dan bonus agen", color: "#9db0dd" },
];

const ORDER_TONE: Record<string, Tone> = { paid: "teal", pending: "amber", cancelled: "rose", refunded: "rose" };

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();
  const o = await getAdminOverview();
  const p = o.period;
  const agentShare = p.commission + p.override;
  const maxLevel = Math.max(1, ...o.levelDistribution.map((l) => l.count));
  const orderTotal = o.orders.paidCount + o.orders.pendingCount;
  const adminPercent = p.gross ? (p.admin / p.gross) * 100 : 0;
  const withdrawnPercent = o.wallet.earned > 0 ? (o.withdrawals.paidAmount / o.wallet.earned) * 100 : 0;

  const activity: ActivityItem[] = [
    ...o.recentOrders.map((r) => ({
      at: new Date(r.createdAt).getTime(),
      item: {
        id: `o-${r.id}`,
        icon: ReceiptText,
        tone: ORDER_TONE[r.status] ?? "navy",
        title: (
          <>
            {r.sellerName ?? "Penjualan langsung"} · {r.productName}
          </>
        ),
        detail: `${r.customerName} · ${r.code}`,
        time: formatRelative(r.createdAt),
        amount: <span className="text-navy">{formatIDR(r.amount)}</span>,
      } satisfies ActivityItem,
    })),
    ...o.recentAgents.map((a) => ({
      at: new Date(a.createdAt).getTime(),
      item: {
        id: `a-${a.id}`,
        icon: UserPlus,
        tone: (a.status === "pending" ? "amber" : "sky") as Tone,
        title: <>{a.name} mendaftar sebagai agen</>,
        detail: `${a.levelName}${a.status === "pending" ? " · menunggu persetujuan" : ""}`,
        time: formatRelative(a.createdAt),
      } satisfies ActivityItem,
    })),
  ]
    .sort((x, y) => y.at - x.at)
    .slice(0, 7)
    .map((x) => x.item);

  const pending: PendingItem[] = [
    {
      href: "/admin/penarikan?status=pending",
      icon: Banknote,
      tone: "amber",
      count: o.withdrawals.pendingCount,
      title: "Penarikan menunggu",
      text: o.withdrawals.pendingCount > 0 ? `${formatIDR(o.withdrawals.pendingAmount)} menunggu ditransfer dan diberi bukti.` : "Tidak ada penarikan yang menunggu.",
      action: "Proses penarikan",
    },
    {
      href: "/admin/agen?status=pending",
      icon: UserCheck,
      tone: "sky",
      count: o.agents.pending,
      title: "Persetujuan agen",
      text: o.agents.pending > 0 ? "Pendaftar baru menunggu tinjauan sebelum bisa berjualan." : "Semua pendaftar sudah ditinjau.",
      action: "Tinjau agen",
    },
    {
      href: "/admin/pesanan?status=pending",
      icon: ReceiptText,
      tone: "rose",
      count: o.orders.pendingCount,
      title: "Pesanan belum lunas",
      text: "Komisi dan bonus tim dibagikan setelah pesanan ditandai lunas.",
      action: "Buka pesanan",
    },
  ];

  return (
    <div className="grid gap-6">
      <WelcomeBanner
        title={`Selamat datang, ${admin.name.split(" ")[0]}!`}
        date={formatToday()}
        subtitle={
          p.orders > 0
            ? `30 hari terakhir: ${p.orders} pesanan lunas, ${formatIDR(agentShare)} dibagikan ke agen.`
            : "Belum ada pesanan lunas dalam 30 hari terakhir."
        }
        actions={
          <>
            <Button asChild size="lg" className="bg-white text-navy hover:bg-white/90">
              <Link href="/admin/pesanan">Catat penjualan</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="border border-white/25 text-white hover:bg-white/10 hover:text-white">
              <Link href="/admin/produk/baru">Tambah produk</Link>
            </Button>
          </>
        }
        stats={[
          { icon: ShoppingBag, label: "Pesanan lunas", value: p.orders, hint: "30 hari terakhir" },
          { icon: Users, label: "Agen aktif", value: o.agents.active, hint: `${o.agents.total} agen terdaftar` },
          { icon: Banknote, label: "Omzet 30 hari", value: formatIDR(p.gross), hint: `Dibagikan ke agen ${formatIDR(agentShare)}` },
          { icon: Percent, label: "Bagian Kerjalin", value: p.gross ? formatPercent(Math.round(adminPercent)) : "-", hint: formatIDR(p.admin) },
        ]}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Banknote}
          tone="navy"
          label="Omzet 30 hari"
          value={formatIDR(p.gross)}
          hint={`${p.orders} pesanan lunas`}
          progress={p.gross ? { label: "Bagian Kerjalin", percent: adminPercent } : undefined}
        />
        <StatCard
          icon={Users}
          tone="sky"
          label="Total agen"
          value={o.agents.total}
          hint={`${o.agents.active} aktif · ${o.agents.pending} menunggu`}
          progress={o.agents.total ? { label: "Agen aktif", percent: (o.agents.active / o.agents.total) * 100 } : undefined}
        />
        <StatCard
          icon={ReceiptText}
          tone="teal"
          label="Pesanan lunas"
          value={o.orders.paidCount}
          hint={`${o.orders.pendingCount} belum lunas · omzet ${formatIDR(o.orders.gross)}`}
          progress={orderTotal ? { label: "Sudah lunas", percent: (o.orders.paidCount / orderTotal) * 100 } : undefined}
        />
        <StatCard
          icon={Wallet}
          tone="violet"
          label="Saldo agen belum ditarik"
          value={formatIDR(o.wallet.outstanding)}
          hint={`Sudah dibayarkan ${formatIDR(o.withdrawals.paidAmount)}`}
          progress={o.wallet.earned > 0 ? { label: "Komisi yang sudah ditarik", percent: withdrawnPercent } : undefined}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Panel
          title="Omzet harian"
          description="Setiap hari dibagi antara bagian Kerjalin dan komisi agen."
          action={<ChartKey series={SERIES} />}
        >
          <BarsChart data={o.daily} series={SERIES} className="aspect-auto h-72 w-full" />
        </Panel>

        <Panel title="Aktivitas terbaru" description="Pesanan dan pendaftar agen">
          <ActivityList items={activity} empty="Belum ada aktivitas." />
        </Panel>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Panel title="Aksi cepat" description="Tugas admin yang paling sering">
          <QuickActions
            items={[
              { href: "/admin/produk/baru", icon: PackagePlus, tone: "navy", title: "Tambah produk", text: "Buat produk baru di katalog" },
              { href: "/admin/pesanan", icon: ReceiptText, tone: "navy", title: "Catat penjualan", text: "Pesanan langsung atau via agen" },
              { href: "/admin/agen?status=pending", icon: UserCheck, tone: "teal", title: "Setujui agen", text: "Tinjau pendaftar baru" },
              { href: "/admin/level", icon: Layers, tone: "violet", title: "Atur level", text: "Komisi, bonus tim, dan slot" },
            ]}
          />
        </Panel>

        <Panel
          title="Agen dengan komisi tertinggi"
          description="Sejak bergabung"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/agen">
                Semua agen <ArrowRight />
              </Link>
            </Button>
          }
        >
          <RankedList
            empty="Belum ada data."
            items={o.topAgents.map((a, i) => ({
              id: a.id,
              rank: i + 1,
              name: a.name,
              sub: a.levelName,
              value: formatIDR(a.earned),
              href: `/admin/agen/${a.id}`,
              thumb: (
                <Avatar className="size-11">
                  {a.image && <AvatarImage src={a.image} alt="" />}
                  <AvatarFallback className="bg-white text-xs font-bold text-navy">{initials(a.name)}</AvatarFallback>
                </Avatar>
              ),
            }))}
          />
        </Panel>
      </div>

      <section aria-label="Perlu ditindak">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-navy">Perlu ditindak</h2>
          {o.withdrawals.pendingCount + o.agents.pending + o.orders.pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-[#c02a47]">
              <Hourglass className="size-3.5" aria-hidden />
              {o.withdrawals.pendingCount + o.agents.pending + o.orders.pendingCount} menunggu
            </span>
          )}
        </div>
        <PendingCards items={pending} />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <Panel
          title="Pesanan terbaru"
          flush
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/pesanan">
                Semua pesanan <ArrowRight />
              </Link>
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Pesanan</TableHead>
                <TableHead>Agen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {o.recentOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Belum ada pesanan.
                  </TableCell>
                </TableRow>
              )}
              {o.recentOrders.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-5">
                    <p className="font-semibold text-navy">{r.productName}</p>
                    <p className="max-w-[15rem] truncate text-[0.8125rem] text-muted-foreground">
                      {r.customerName} · {r.code}
                    </p>
                  </TableCell>
                  <TableCell>{r.sellerName ?? <span className="text-muted-foreground">Langsung</span>}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="pr-5 text-right font-medium tabular-nums">{formatIDR(r.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <div className="grid gap-6">
          <Panel title="Ke mana omzet mengalir" description="30 hari terakhir">
            <SplitBar
              empty="Belum ada pesanan lunas."
              segments={[
                { label: "Kerjalin", value: p.admin, color: "#082052" },
                { label: "Komisi penjualan agen", value: p.commission, color: "#6b7a9e" },
                { label: "Bonus tim", value: p.override, color: "#b9c2da" },
              ]}
            />
          </Panel>
          <Panel title="Agen per level">
            <ul className="grid gap-3.5">
              {o.levelDistribution.length === 0 && <li className="text-sm text-muted-foreground">Belum ada level.</li>}
              {o.levelDistribution.map((l) => (
                <li key={l.id} className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <LevelBadge name={l.name} color={l.color} />
                    <span className="text-sm font-semibold tabular-nums text-navy">{l.count}</span>
                  </div>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <span className="block h-full rounded-full bg-navy" style={{ width: `${(l.count / maxLevel) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
