import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LedgerTable } from "@/components/app/ledger-table";
import { PageHeader, StatCard } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { walletTypeLabel } from "@/components/app/badges";
import { WALLET_ENTRY_TYPES } from "@/db/schema";
import { Banknote, Wallet, WalletCards } from "lucide-react";
import { formatIDR } from "@/lib/format";
import { getWalletSummary } from "@/lib/queries/admin";
import { listWallet } from "@/lib/queries/agent";
import { pageParam, pickEnum } from "@/lib/search-params";
import { requireAgent } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Riwayat Komisi" };

export default async function CommissionPage(props: PageProps<"/dashboard/komisi">) {
  const { agent } = await requireAgent();
  const sp = await props.searchParams;
  const type = pickEnum(sp.type, WALLET_ENTRY_TYPES);
  const page = pageParam(sp.page);

  const [summary, list] = await Promise.all([
    getWalletSummary(agent.id),
    listWallet(agent.id, { type, page }),
  ]);

  const filters = [{ value: undefined, label: "Semua" }, ...WALLET_ENTRY_TYPES.map((t) => ({ value: t, label: walletTypeLabel[t] }))];

  return (
    <>
      <PageHeader title="Riwayat Komisi" description="Semua pemasukan dan pengurangan saldo dompetmu." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Saldo tersedia" value={formatIDR(summary.balance)} icon={Wallet} tone="green" />
        <StatCard label="Total komisi" value={formatIDR(summary.earned)} icon={Banknote} />
        <StatCard label="Sudah ditarik" value={formatIDR(summary.paidWithdrawal)} icon={WalletCards} tone="amber" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/dashboard/komisi?type=${f.value}` : "/dashboard/komisi"}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              type === f.value ? "border-navy bg-navy text-white" : "bg-card text-muted-foreground hover:bg-accent",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        <LedgerTable rows={list.rows} empty="Belum ada transaksi pada filter ini." />
        <div className="border-t p-4">
          <Pagination
            page={list.page}
            pageCount={list.pageCount}
            total={list.total}
            basePath="/dashboard/komisi"
            params={{ type }}
          />
        </div>
      </Card>
    </>
  );
}
