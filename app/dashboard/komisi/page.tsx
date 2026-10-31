import type { Metadata } from "next";
import { LedgerTable } from "@/components/app/ledger-table";
import { KpiStrip, PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { TabsNav } from "@/components/app/tabs-nav";
import { walletTypeLabel } from "@/components/app/badges";
import { WALLET_ENTRY_TYPES } from "@/db/schema";
import { formatIDR } from "@/lib/format";
import { getWalletSummary } from "@/lib/queries/admin";
import { listWallet } from "@/lib/queries/agent";
import { pageParam, pickEnum } from "@/lib/search-params";
import { requireAgent } from "@/lib/session";

export const metadata: Metadata = { title: "Riwayat komisi" };

export default async function CommissionPage(props: PageProps<"/dashboard/komisi">) {
  const { agent } = await requireAgent();
  const sp = await props.searchParams;
  const type = pickEnum(sp.type, WALLET_ENTRY_TYPES);
  const page = pageParam(sp.page);

  const [summary, list] = await Promise.all([getWalletSummary(agent.id), listWallet(agent.id, { type, page })]);

  const tabs = [{ value: undefined, label: "Semua" }, ...WALLET_ENTRY_TYPES.map((t) => ({ value: t, label: walletTypeLabel[t] }))].map((f) => ({
    label: f.label,
    active: type === f.value,
    href: f.value ? `/dashboard/komisi?type=${f.value}` : "/dashboard/komisi",
  }));

  return (
    <>
      <PageHeader title="Riwayat komisi" description="Semua pemasukan dan pengurangan saldo dompetmu." />

      <KpiStrip
        items={[
          { label: "Saldo tersedia", value: formatIDR(summary.balance), lead: true },
          { label: "Total komisi", value: formatIDR(summary.earned), hint: "Sejak bergabung" },
          { label: "Sudah ditarik", value: formatIDR(summary.paidWithdrawal) },
        ]}
      />

      <div className="mt-6">
        <TabsNav label="Jenis transaksi" items={tabs} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <LedgerTable rows={list.rows} empty="Belum ada transaksi pada filter ini." />
      </div>
      <div className="pt-4">
        <Pagination page={list.page} pageCount={list.pageCount} total={list.total} basePath="/dashboard/komisi" noun="transaksi" params={{ type }} />
      </div>
    </>
  );
}
