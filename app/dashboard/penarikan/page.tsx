import type { Metadata } from "next";
import { ExternalLink, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WithdrawalStatusBadge } from "@/components/app/badges";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { AgentStatusBanner } from "@/components/agent/status-banner";
import { WithdrawForm } from "@/components/agent/withdraw-form";
import { MIN_WITHDRAWAL } from "@/lib/config";
import { formatDateTime, formatIDR } from "@/lib/format";
import { getWalletSummary } from "@/lib/queries/admin";
import { listAgentWithdrawals } from "@/lib/queries/agent";
import { requireAgent } from "@/lib/session";

export const metadata: Metadata = { title: "Penarikan" };

export default async function WithdrawalsPage() {
  const { agent } = await requireAgent();
  const [summary, rows] = await Promise.all([getWalletSummary(agent.id), listAgentWithdrawals(agent.id)]);
  const hasPending = rows.some((r) => r.status === "pending");
  const hasBank = Boolean(agent.bankName && agent.bankAccountNumber && agent.bankAccountName);

  const disabledReason =
    agent.status !== "active"
      ? "Penarikan hanya tersedia untuk akun yang sudah aktif."
      : hasPending
        ? "Masih ada permintaan penarikan yang sedang diproses."
        : undefined;

  return (
    <>
      <PageHeader title="Penarikan" description="Ajukan pencairan komisi ke rekening bank atau e-wallet kamu." />
      <AgentStatusBanner status={agent.status} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <WithdrawForm
          balance={summary.balance}
          min={MIN_WITHDRAWAL}
          hasBank={hasBank}
          bankLabel={hasBank ? `${agent.bankName} · ${agent.bankAccountNumber} · a.n. ${agent.bankAccountName}` : undefined}
          disabledReason={disabledReason}
        />

        <Card className="gap-0 overflow-hidden p-0 content-start">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-extrabold text-navy">Riwayat penarikan</h2>
          </div>
          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={WalletCards} title="Belum ada penarikan" description="Riwayat pencairanmu akan tampil di sini." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="pr-5 text-right">Bukti</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="pl-5">
                        <p className="text-sm">{formatDateTime(w.createdAt)}</p>
                        {w.adminNote && <p className="max-w-52 text-xs text-muted-foreground">{w.adminNote}</p>}
                      </TableCell>
                      <TableCell>
                        <WithdrawalStatusBadge status={w.status} />
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatIDR(w.amount)}</TableCell>
                      <TableCell className="pr-5 text-right">
                        {w.proofUrl ? (
                          <Button asChild variant="outline" size="sm">
                            <a href={w.proofUrl} target="_blank" rel="noreferrer">
                              <ExternalLink /> Lihat
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
