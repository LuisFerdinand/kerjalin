import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Hourglass,
  Network,
  ReceiptText,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AgentStatusBadge, LevelBadge, OrderStatusBadge } from "@/components/app/badges";
import { StackedAreaChart } from "@/components/app/charts";
import { PageHeader, StatCard } from "@/components/app/page-header";
import { formatDate, formatIDR, initials } from "@/lib/format";
import { getAdminOverview } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Ringkasan" };

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();
  const o = await getAdminOverview();
  const maxLevelCount = Math.max(1, ...o.levelDistribution.map((l) => l.count));

  return (
    <>
      <PageHeader
        title={`Halo, ${admin.name.split(" ")[0]}`}
        description="Ringkasan jaringan agen, penjualan, dan komisi Kerjalin."
        actions={
          <Button asChild>
            <Link href="/admin/pohon">
              <Network /> Lihat pohon jaringan
            </Link>
          </Button>
        }
      />

      {(o.agents.pending > 0 || o.withdrawals.pendingCount > 0 || o.orders.pendingCount > 0) && (
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {o.agents.pending > 0 && (
            <ActionAlert href="/admin/agen?status=pending" icon={Users} text={`${o.agents.pending} agen menunggu persetujuan`} />
          )}
          {o.withdrawals.pendingCount > 0 && (
            <ActionAlert
              href="/admin/penarikan?status=pending"
              icon={Banknote}
              text={`${o.withdrawals.pendingCount} penarikan (${formatIDR(o.withdrawals.pendingAmount)}) perlu diproses`}
            />
          )}
          {o.orders.pendingCount > 0 && (
            <ActionAlert href="/admin/pesanan?status=pending" icon={Hourglass} text={`${o.orders.pendingCount} pesanan belum lunas`} />
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total agen"
          value={o.agents.total}
          hint={`${o.agents.active} aktif · ${o.agents.pending} menunggu · ${o.agents.suspended} nonaktif`}
          icon={Users}
        />
        <StatCard
          label="Omzet (pesanan lunas)"
          value={formatIDR(o.orders.gross)}
          hint={`${o.orders.paidCount} pesanan lunas`}
          icon={ReceiptText}
          tone="navy"
        />
        <StatCard
          label="Pendapatan Kerjalin"
          value={formatIDR(o.orders.adminShare)}
          hint="Setelah komisi agen dibagikan"
          icon={CircleDollarSign}
          tone="green"
        />
        <StatCard
          label="Saldo agen belum ditarik"
          value={formatIDR(o.wallet.outstanding)}
          hint={`Total komisi diperoleh ${formatIDR(o.wallet.earned)}`}
          icon={Wallet}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Penjualan 30 hari terakhir</CardTitle>
            <CardDescription>Omzet dibagi antara komisi agen dan pendapatan Kerjalin.</CardDescription>
          </CardHeader>
          <CardContent>
            <StackedAreaChart
              data={o.daily}
              series={[
                { key: "admin", label: "Pendapatan Kerjalin", color: "var(--chart-2)" },
                { key: "commission", label: "Komisi agen", color: "var(--chart-1)" },
              ]}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Agen per level</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {o.levelDistribution.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada level.</p>
              )}
              {o.levelDistribution.map((l) => (
                <div key={l.id} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <LevelBadge name={l.name} color={l.color} />
                    <span className="font-bold text-navy tabular-nums">{l.count}</span>
                  </div>
                  <Progress value={(l.count / maxLevelCount) * 100} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agen dengan komisi tertinggi</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {o.topAgents.length === 0 && <p className="text-sm text-muted-foreground">Belum ada data.</p>}
              {o.topAgents.map((a, i) => (
                <Link
                  key={a.id}
                  href={`/admin/agen/${a.id}`}
                  className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-accent"
                >
                  <span className="w-4 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <Avatar className="size-8">
                    {a.image && <AvatarImage src={a.image} alt="" />}
                    <AvatarFallback className="bg-brand/10 text-xs font-bold text-brand">{initials(a.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.levelName}</p>
                  </div>
                  <span className="text-sm font-bold text-navy tabular-nums">{formatIDR(a.earned)}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader>
              <CardTitle>Pesanan terbaru</CardTitle>
              <CardAction>
                <Button asChild variant="ghost" size="sm">
              <Link href="/admin/pesanan">
                Semua <ArrowUpRight />
              </Link>
            </Button>
              </CardAction>
            </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Pesanan</TableHead>
                  <TableHead>Agen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {o.recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Belum ada pesanan.
                    </TableCell>
                  </TableRow>
                )}
                {o.recentOrders.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-6">
                      <p className="font-semibold text-navy">{r.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.code} · {r.customerName}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{r.sellerName ?? <span className="text-muted-foreground">Langsung</span>}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatIDR(r.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <CardTitle>Pendaftar terbaru</CardTitle>
              <CardAction>
                <Button asChild variant="ghost" size="sm">
              <Link href="/admin/agen">
                Semua <ArrowUpRight />
              </Link>
            </Button>
              </CardAction>
            </CardHeader>
          <CardContent className="grid gap-3">
            {o.recentAgents.length === 0 && <p className="text-sm text-muted-foreground">Belum ada agen.</p>}
            {o.recentAgents.map((a) => (
              <Link
                key={a.id}
                href={`/admin/agen/${a.id}`}
                className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-accent"
              >
                <Avatar className="size-9">
                  {a.image && <AvatarImage src={a.image} alt="" />}
                  <AvatarFallback className="bg-brand/10 text-xs font-bold text-brand">{initials(a.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.levelName} · {formatDate(a.createdAt)}
                  </p>
                </div>
                <AgentStatusBadge status={a.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ActionAlert({
  href,
  icon: Icon,
  text,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-navy transition-colors hover:bg-warning/15"
    >
      <Icon className="size-4.5 text-warning" />
      <span className="flex-1">{text}</span>
      <ArrowUpRight className="size-4 text-warning" />
    </Link>
  );
}
