import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WithdrawalStatusBadge } from "@/components/app/badges";
import { CopyButton } from "@/components/app/copy-button";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { TabsNav } from "@/components/app/tabs-nav";
import { WithdrawalActions } from "@/components/admin/withdrawal-actions";
import { WITHDRAWAL_STATUSES } from "@/db/schema";
import { formatDateTime, formatIDR } from "@/lib/format";
import { getWithdrawalCounts, listWithdrawals } from "@/lib/queries/admin";
import { pickEnum } from "@/lib/search-params";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Penarikan" };

export default async function WithdrawalsPage(props: PageProps<"/admin/penarikan">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const status = pickEnum(sp.status, WITHDRAWAL_STATUSES);
  const [rows, counts] = await Promise.all([listWithdrawals({ status }), getWithdrawalCounts()]);
  const pendingTotal = rows
    .filter((r) => r.withdrawal.status === "pending")
    .reduce((sum, r) => sum + r.withdrawal.amount, 0);

  const tab = (label: string, value: (typeof WITHDRAWAL_STATUSES)[number] | undefined, count: number) => ({
    label,
    count,
    active: status === value,
    href: value ? `/admin/penarikan?status=${value}` : "/admin/penarikan",
  });

  return (
    <>
      <PageHeader
        title="Penarikan"
        description={
          pendingTotal > 0
            ? `${formatIDR(pendingTotal)} menunggu ditransfer. Transfer ke rekening agen, lalu tandai sudah dibayar.`
            : "Proses pencairan komisi agen: transfer ke rekening agen, lalu tandai sudah dibayar."
        }
      />

      <TabsNav
        label="Status penarikan"
        items={[
          tab("Semua", undefined, counts.all),
          tab("Perlu diproses", "pending", counts.pending),
          tab("Sudah dibayar", "paid", counts.paid),
          tab("Ditolak", "rejected", counts.rejected),
        ]}
      />

      <div className="pt-4">
        {rows.length === 0 ? (
          <EmptyState icon={Banknote} title="Belum ada permintaan penarikan" description="Permintaan dari agen akan muncul di sini." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Agen</TableHead>
                    <TableHead>Rekening tujuan</TableHead>
                    <TableHead>Diajukan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="pr-5 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ withdrawal: w, agentId, name, phone }) => (
                    <TableRow key={w.id}>
                      <TableCell className="pl-5">
                        <Link href={`/admin/agen/${agentId}`} className="font-semibold text-navy hover:underline">
                          {name}
                        </Link>
                        {phone && <p className="text-[0.8125rem] text-muted-foreground">{phone}</p>}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{w.bankName}</p>
                        <div className="flex items-center gap-1.5">
                          <code className="text-[0.9375rem] tabular-nums">{w.bankAccountNumber}</code>
                          <CopyButton
                            value={w.bankAccountNumber}
                            label="Salin nomor rekening"
                            successMessage="Nomor rekening disalin"
                            variant="ghost"
                            size="icon-sm"
                          />
                        </div>
                        <p className="text-[0.8125rem] text-muted-foreground">a.n. {w.bankAccountName}</p>
                      </TableCell>
                      <TableCell className="text-[0.8125rem] text-muted-foreground">{formatDateTime(w.createdAt)}</TableCell>
                      <TableCell>
                        <WithdrawalStatusBadge status={w.status} />
                        {w.adminNote && <p className="mt-1 max-w-48 text-[0.8125rem] whitespace-normal text-muted-foreground">{w.adminNote}</p>}
                      </TableCell>
                      <TableCell className="text-right text-base font-semibold tabular-nums text-navy">{formatIDR(w.amount)}</TableCell>
                      <TableCell className="pr-5">
                        {w.status === "pending" ? (
                          <WithdrawalActions id={w.id} name={name} amount={w.amount} bank={`${w.bankName} ${w.bankAccountNumber}`} />
                        ) : (
                          w.proofUrl && (
                            <div className="flex justify-end">
                              <Button asChild variant="outline" size="sm">
                                <a href={w.proofUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink /> Bukti
                                </a>
                              </Button>
                            </div>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
