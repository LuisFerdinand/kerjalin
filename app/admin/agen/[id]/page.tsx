import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  Banknote,
  Building2,
  ChevronRight,
  Crown,
  Link2,
  MapPin,
  Phone,
  Settings2,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AgentStatusBadge,
  LevelBadge,
  OrderStatusBadge,
  WithdrawalStatusBadge,
} from "@/components/app/badges";
import { CopyButton } from "@/components/app/copy-button";
import { LedgerTable } from "@/components/app/ledger-table";
import { StatCard } from "@/components/app/page-header";
import {
  AdjustWalletDialog,
  AgentStatusButton,
  EditAgentDialog,
  MoveAgentDialog,
} from "@/components/admin/agent-dialogs";
import { siteConfig } from "@/lib/config";
import { formatDate, formatDateTime, formatIDR, formatPercent, initials } from "@/lib/format";
import { effectiveCommission } from "@/lib/mlm";
import { getAgentDetail, getTreeNodes, listLevelOptions } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Detail Agen" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AgentDetailPage(props: PageProps<"/admin/agen/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();

  const [d, levels, nodes] = await Promise.all([getAgentDetail(id), listLevelOptions(), getTreeNodes()]);
  if (!d) notFound();

  const { agent, user, level } = d;
  const refLink = `${siteConfig.url}/r/${agent.referralCode}`;
  const slotPct = d.slots ? Math.min(100, (d.children.length / d.slots) * 100) : 0;
  const commission = effectiveCommission(agent, level);

  return (
    <>
      <Link
        href="/admin/agen"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-navy"
      >
        <ArrowLeft className="size-4" /> Semua agen
      </Link>

      <Card className="mb-6 gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="size-16">
              {user.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback className="bg-brand text-lg font-bold text-white">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-navy">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <LevelBadge name={level.name} color={level.color} />
                <AgentStatusBadge status={agent.status} />
                <span className="text-xs text-muted-foreground">Bergabung {formatDate(agent.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <EditAgentDialog
              agent={{
                id: agent.id,
                name: user.name,
                levelId: agent.levelId,
                status: agent.status,
                maxDownlinesOverride: agent.maxDownlinesOverride,
                commissionPercentOverride: agent.commissionPercentOverride,
                adminNotes: agent.adminNotes,
                levelSlots: level.maxDownlines,
                levelCommission: Number(level.commissionPercent),
              }}
              levels={levels}
              trigger={
                <Button variant="outline">
                  <Settings2 /> Atur agen
                </Button>
              }
            />
            <MoveAgentDialog
              agent={{ id: agent.id, name: user.name, parentId: agent.parentId, levelId: agent.levelId }}
              nodes={nodes}
              levels={levels}
              trigger={
                <Button variant="outline">
                  <ArrowRightLeft /> Pindahkan
                </Button>
              }
            />
            <AdjustWalletDialog
              agentId={agent.id}
              name={user.name}
              trigger={
                <Button variant="outline">
                  <WalletCards /> Koreksi saldo
                </Button>
              }
            />
            <AgentStatusButton id={agent.id} status={agent.status} size="default" variant={agent.status === "pending" ? "default" : "outline"} />
          </div>
        </div>

        <nav aria-label="Posisi dalam jaringan" className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/70 px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-navy">
            <Crown className="size-3.5 text-warning" /> Kerjalin
          </span>
          {d.ancestors.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1.5">
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <Link href={`/admin/agen/${a.id}`} className="font-medium text-brand hover:underline">
                {a.name}
              </Link>
            </span>
          ))}
          <ChevronRight className="size-3.5 text-muted-foreground" />
          <span className="font-bold text-navy">{user.name}</span>
        </nav>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo tersedia" value={formatIDR(d.wallet.balance)} icon={Wallet} tone="green" />
        <StatCard
          label="Total komisi diperoleh"
          value={formatIDR(d.wallet.earned)}
          hint={`Komisi penjualan ${formatPercent(commission)}${agent.commissionPercentOverride ? " (khusus)" : ""}`}
          icon={Banknote}
        />
        <StatCard
          label="Penarikan"
          value={formatIDR(d.wallet.paidWithdrawal)}
          hint={d.wallet.pendingWithdrawal ? `${formatIDR(d.wallet.pendingWithdrawal)} sedang diproses` : "Sudah dibayarkan"}
          icon={WalletCards}
          tone="amber"
        />
        <StatCard
          label="Tim"
          value={`${d.children.length}/${d.slots ?? "∞"}`}
          hint={`${d.downlineTotal} agen di seluruh downline`}
          icon={Users}
          tone="navy"
        />
      </div>

      <Tabs defaultValue="ringkasan" className="mt-6">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
          <TabsTrigger value="dompet">Riwayat dompet</TabsTrigger>
          <TabsTrigger value="pesanan">Penjualan ({d.orders.length})</TabsTrigger>
          <TabsTrigger value="penarikan">Penarikan ({d.withdrawals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan" className="mt-4 grid gap-6 xl:grid-cols-[1fr_1.3fr]">
          <div className="grid content-start gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profil</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <InfoRow icon={Phone} label="WhatsApp">
                  {agent.phone ? (
                    <a
                      className="font-medium text-brand hover:underline"
                      href={`https://wa.me/${agent.phone.replace(/^0/, "62")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {agent.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </InfoRow>
                <InfoRow icon={MapPin} label="Kota">{agent.city ?? "-"}</InfoRow>
                <InfoRow icon={Building2} label="Rekening bank">
                  {agent.bankName ? (
                    <span>
                      {agent.bankName} · {agent.bankAccountNumber}
                      <span className="block text-xs text-muted-foreground">a.n. {agent.bankAccountName}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Belum diisi</span>
                  )}
                </InfoRow>
                <InfoRow icon={Link2} label="Tautan referral">
                  <span className="flex flex-col items-end gap-1.5">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{agent.referralCode}</code>
                    <CopyButton value={refLink} label="Salin tautan" />
                  </span>
                </InfoRow>
                {agent.adminNotes && (
                  <div className="rounded-lg bg-warning/10 p-3 text-sm text-navy">
                    <p className="mb-1 text-xs font-bold tracking-wide text-warning uppercase">Catatan admin</p>
                    {agent.adminNotes}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pengaturan level</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Komisi penjualan</span>
                  <strong>{formatPercent(commission)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bonus tim</span>
                  <strong>
                    {level.overridePercents.length
                      ? level.overridePercents.map((p, i) => `T${i + 1}: ${formatPercent(p)}`).join(" · ")
                      : "Tidak ada"}
                  </strong>
                </div>
                <div className="grid gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slot downline langsung</span>
                    <strong>
                      {d.children.length}/{d.slots ?? "∞"}
                      {agent.maxDownlinesOverride !== null && " (khusus)"}
                    </strong>
                  </div>
                  {d.slots !== null && <Progress value={slotPct} className="h-1.5" />}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="gap-0 overflow-hidden p-0 content-start">
            <CardHeader className="border-b py-4">
              <CardTitle>Downline langsung ({d.children.length})</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Agen</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-center">Tim</TableHead>
                  <TableHead className="pr-5">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.children.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Belum ada downline.
                    </TableCell>
                  </TableRow>
                )}
                {d.children.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-5">
                      <Link href={`/admin/agen/${c.id}`} className="font-semibold text-navy hover:underline">
                        {c.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </TableCell>
                    <TableCell>
                      <LevelBadge name={c.levelName} color={c.levelColor} />
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{c.directCount}</TableCell>
                    <TableCell className="pr-5">
                      <AgentStatusBadge status={c.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="dompet" className="mt-4">
          <Card className="gap-0 overflow-hidden p-0">
            <LedgerTable rows={d.entries} />
          </Card>
          <p className="mt-2 text-xs text-muted-foreground">Menampilkan 25 transaksi terakhir.</p>
        </TabsContent>

        <TabsContent value="pesanan" className="mt-4">
          <Card className="gap-0 overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Pesanan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="pr-5 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Belum ada penjualan.
                    </TableCell>
                  </TableRow>
                )}
                {d.orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-5">
                      <p className="font-semibold text-navy">{o.productName}</p>
                      <p className="text-xs text-muted-foreground">{o.code}</p>
                    </TableCell>
                    <TableCell className="text-sm">{o.customerName}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                    <TableCell className="pr-5 text-right font-semibold tabular-nums">{formatIDR(o.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="penarikan" className="mt-4">
          <Card className="gap-0 overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Tanggal</TableHead>
                  <TableHead>Rekening</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.withdrawals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Belum ada permintaan penarikan.
                    </TableCell>
                  </TableRow>
                )}
                {d.withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="pl-5 text-sm">{formatDateTime(w.createdAt)}</TableCell>
                    <TableCell className="text-sm">
                      {w.bankName} · {w.bankAccountNumber}
                    </TableCell>
                    <TableCell>
                      <WithdrawalStatusBadge status={w.status} />
                    </TableCell>
                    <TableCell className="pr-5 text-right font-semibold tabular-nums">{formatIDR(w.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" /> {label}
      </span>
      <span className="text-right font-medium text-navy">{children}</span>
    </div>
  );
}
