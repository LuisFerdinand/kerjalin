import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WithdrawalStatusBadge } from "@/components/app/badges";
import { PageHeader, Panel } from "@/components/app/page-header";
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
      <PageHeader title="Penarikan" description="Cairkan komisi ke rekening bank atau e-wallet milikmu." />
      <AgentStatusBanner status={agent.status} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <WithdrawForm
          balance={summary.balance}
          min={MIN_WITHDRAWAL}
          hasBank={hasBank}
          bankLabel={hasBank ? `${agent.bankName} · ${agent.bankAccountNumber} · a.n. ${agent.bankAccountName}` : undefined}
          disabledReason={disabledReason}
        />

        <Panel title="Riwayat penarikan" flush>
          {rows.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-muted-foreground">Belum ada penarikan. Riwayat pencairanmu akan tampil di sini.</p>
          ) : (
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
                      <p>{formatDateTime(w.createdAt)}</p>
                      {w.adminNote && <p className="max-w-52 text-[0.8125rem] whitespace-normal text-muted-foreground">{w.adminNote}</p>}
                    </TableCell>
                    <TableCell>
                      <WithdrawalStatusBadge status={w.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatIDR(w.amount)}</TableCell>
                    <TableCell className="pr-5 text-right">
                      {w.proofUrl ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={w.proofUrl} target="_blank" rel="noreferrer">
                            <ExternalLink /> Lihat
                          </a>
                        </Button>
                      ) : (
                        <span className="text-faint">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
