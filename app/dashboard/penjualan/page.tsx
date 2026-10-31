import type { Metadata } from "next";
import { ReceiptText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/app/badges";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { formatDate, formatIDR } from "@/lib/format";
import { listAgentOrders } from "@/lib/queries/agent";
import { requireAgent } from "@/lib/session";

export const metadata: Metadata = { title: "Penjualan" };

export default async function SalesPage() {
  const { agent } = await requireAgent();
  const rows = await listAgentOrders(agent.id);
  const paid = rows.filter((r) => r.status === "paid");

  return (
    <>
      <PageHeader
        title="Penjualan"
        description={
          rows.length
            ? `${paid.length} lunas dari ${rows.length} pesanan. Komisi masuk otomatis saat pesanan lunas.`
            : "Langganan pelanggan yang tercatat atas namamu. Komisi masuk otomatis saat pesanan lunas."
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="Belum ada penjualan"
          description="Setelah pelanggan berlangganan lewat kamu dan admin mencatatnya, penjualan akan tampil di sini."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Pesanan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead className="text-right">Lama</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-5">
                      <p className="font-semibold text-navy">{o.productName}</p>
                      <p className="text-[0.8125rem] text-muted-foreground">
                        {o.code} · {formatDate(o.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell>{o.customerName}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.months} bulan</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="pr-5 text-right font-medium tabular-nums">{formatIDR(o.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
}
