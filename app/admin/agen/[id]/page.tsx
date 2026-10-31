import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRightLeft, Settings2, WalletCards } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentStatusBadge, LevelBadge, OrderStatusBadge, WithdrawalStatusBadge } from "@/components/app/badges";
import { CopyButton } from "@/components/app/copy-button";
import { LedgerTable } from "@/components/app/ledger-table";
import { KpiStrip, Panel } from "@/components/app/page-header";
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

export const metadata: Metadata = { title: "Detail agen" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AgentDetailPage(props: PageProps<"/admin/agen/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();

  const [d, levels, nodes] = await Promise.all([getAgentDetail(id), listLevelOptions(), getTreeNodes()]);
  if (!d) notFound();

  const { agent, user, level } = d;
  const refLink = `${siteConfig.url}/r/${agent.referralCode}`;
  const commission = effectiveCommission(agent, level);
  const tabClass = "h-10 flex-none px-0 text-[0.9375rem] data-active:font-semibold";

  return (
    <>
      <Link
        href="/admin/agen"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-navy"
      >
        <ArrowLeft className="size-4" /> Semua agen
      </Link>

      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-14">
            {user.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="bg-navy text-lg font-semibold text-white">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-navy">{user.name}</h1>
            <p className="text-[0.9375rem] text-muted-foreground">{user.email}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <LevelBadge name={level.name} color={level.color} />
              <AgentStatusBadge status={agent.status} />
              <span className="text-[0.8125rem] text-muted-foreground">Bergabung {formatDate(agent.createdAt)}</span>
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
          <AgentStatusButton
            id={agent.id}
            status={agent.status}
            size="default"
            variant={agent.status === "pending" ? "default" : "outline"}
          />
        </div>
      </div>

      <p className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem]" aria-label="Posisi dalam jaringan">
        <span className="text-muted-foreground">Posisi:</span>
        <span className="font-medium text-navy">Kerjalin</span>
        {d.ancestors.map((a) => (
          <span key={a.id} className="flex items-center gap-2">
            <span className="text-faint" aria-hidden>
              ›
            </span>
            <Link href={`/admin/agen/${a.id}`} className="font-medium text-navy underline-offset-2 hover:underline">
              {a.name}
            </Link>
          </span>
        ))}
        <span className="text-faint" aria-hidden>
          ›
        </span>
        <span className="font-semibold text-navy">{user.name}</span>
      </p>

      <KpiStrip
        items={[
          { label: "Saldo tersedia", value: formatIDR(d.wallet.balance), lead: true },
          {
            label: "Total komisi",
            value: formatIDR(d.wallet.earned),
            hint: `Komisi penjualan ${formatPercent(commission)}${agent.commissionPercentOverride ? " (khusus)" : ""}`,
          },
          {
            label: "Sudah ditarik",
            value: formatIDR(d.wallet.paidWithdrawal),
            hint: d.wallet.pendingWithdrawal ? `${formatIDR(d.wallet.pendingWithdrawal)} sedang diproses` : undefined,
          },
          {
            label: "Downline langsung",
            value: `${d.children.length} / ${d.slots ?? "∞"}`,
            hint: `${d.downlineTotal} agen di seluruh downline`,
          },
        ]}
      />

      <Tabs defaultValue="ringkasan" className="mt-8 gap-5">
        <TabsList variant="line" className="h-10 w-full justify-start gap-7 rounded-none border-b border-border px-0">
          <TabsTrigger value="ringkasan" className={tabClass}>
            Ringkasan
          </TabsTrigger>
          <TabsTrigger value="dompet" className={tabClass}>
            Riwayat dompet
          </TabsTrigger>
          <TabsTrigger value="pesanan" className={tabClass}>
            Penjualan <span className="font-normal tabular-nums text-faint">{d.orders.length}</span>
          </TabsTrigger>
          <TabsTrigger value="penarikan" className={tabClass}>
            Penarikan <span className="font-normal tabular-nums text-faint">{d.withdrawals.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan" className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <div className="grid gap-6">
            <Panel title="Profil dan kontak">
              <dl className="grid gap-3.5 text-[0.9375rem]">
                <Row label="WhatsApp">
                  {agent.phone ? (
                    <a
                      className="font-medium text-navy underline underline-offset-2"
                      href={`https://wa.me/${agent.phone.replace(/^0/, "62")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {agent.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </Row>
                <Row label="Kota">{agent.city ?? "-"}</Row>
                <Row label="Rekening bank">
                  {agent.bankName ? (
                    <span>
                      {agent.bankName} · {agent.bankAccountNumber}
                      <span className="block text-[0.8125rem] text-muted-foreground">a.n. {agent.bankAccountName}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Belum diisi</span>
                  )}
                </Row>
                <Row label="Kode referral">
                  <span className="flex flex-col items-end gap-1.5">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[0.8125rem] font-semibold">{agent.referralCode}</code>
                    <CopyButton value={refLink} label="Salin tautan" />
                  </span>
                </Row>
              </dl>
              {agent.adminNotes && (
                <p className="mt-4 rounded-lg bg-[#fff4d6] p-3 text-sm text-[#7a4a00]">
                  <span className="mb-0.5 block text-[0.8125rem] font-semibold">Catatan admin</span>
                  {agent.adminNotes}
                </p>
              )}
            </Panel>

            <Panel title="Aturan level">
              <dl className="grid gap-3.5 text-[0.9375rem]">
                <Row label="Komisi penjualan">{formatPercent(commission)}</Row>
                <Row label="Bonus tim">
                  {level.overridePercents.length
                    ? level.overridePercents.map((p, i) => `Tingkat ${i + 1}: ${formatPercent(p)}`).join(" · ")
                    : "Tidak ada"}
                </Row>
                <Row label="Slot downline langsung">
                  {d.children.length} dari {d.slots ?? "tanpa batas"}
                  {agent.maxDownlinesOverride !== null && " (khusus)"}
                </Row>
              </dl>
            </Panel>
          </div>

          <Panel title={`Downline langsung (${d.children.length})`} flush>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Agen</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Downline</TableHead>
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
                      <p className="text-[0.8125rem] text-muted-foreground">{c.email}</p>
                    </TableCell>
                    <TableCell>
                      <LevelBadge name={c.levelName} color={c.levelColor} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.directCount}</TableCell>
                    <TableCell className="pr-5">
                      <AgentStatusBadge status={c.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>

        <TabsContent value="dompet">
          <Panel flush>
            <LedgerTable rows={d.entries} />
          </Panel>
          <p className="mt-2 text-[0.8125rem] text-muted-foreground">Menampilkan 25 transaksi terakhir.</p>
        </TabsContent>

        <TabsContent value="pesanan">
          <Panel flush>
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
                      <p className="text-[0.8125rem] text-muted-foreground">{o.code}</p>
                    </TableCell>
                    <TableCell>{o.customerName}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-[0.8125rem] text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                    <TableCell className="pr-5 text-right font-medium tabular-nums">{formatIDR(o.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>

        <TabsContent value="penarikan">
          <Panel flush>
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
                    <TableCell className="pl-5">{formatDateTime(w.createdAt)}</TableCell>
                    <TableCell>
                      {w.bankName} · {w.bankAccountNumber}
                    </TableCell>
                    <TableCell>
                      <WithdrawalStatusBadge status={w.status} />
                    </TableCell>
                    <TableCell className="pr-5 text-right font-medium tabular-nums">{formatIDR(w.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-navy">{children}</dd>
    </div>
  );
}
