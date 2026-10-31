import type { Metadata } from "next";
import { ReceiptText } from "lucide-react";
import { Card } from "@/components/ui/card";
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

  return (
    <>
      <PageHeader
        title="Penjualan"
        description="Langganan pelanggan yang tercatat atas namamu. Komisi masuk otomatis saat pesanan lunas."
      />
      <Card className="gap-0 overflow-hidden p-0">
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ReceiptText}
              title="Belum ada penjualan"
              description="Setelah pelanggan berlangganan lewat kamu dan admin mencatatnya, penjualan akan tampil di sini."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Pesanan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-5">
                      <p className="font-semibold text-navy">{o.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.code} · {formatDate(o.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{o.customerName}</TableCell>
                    <TableCell className="text-sm">{o.months} bulan</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="pr-5 text-right font-semibold tabular-nums">{formatIDR(o.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
}
