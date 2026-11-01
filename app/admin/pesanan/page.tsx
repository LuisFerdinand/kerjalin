import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ReceiptText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/app/badges";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { TabsNav } from "@/components/app/tabs-nav";
import { CreateOrderDialog, OrderRowActions } from "@/components/admin/order-actions";
import { PaymentProofDialog } from "@/components/admin/payment-proof";
import { ORDER_STATUSES } from "@/db/schema";
import { formatDate, formatIDR } from "@/lib/format";
import { PAYMENT_META } from "@/lib/payments/meta";
import { getOrderCounts, getTreeNodes, listOrders } from "@/lib/queries/admin";
import { listSellableProducts } from "@/lib/queries/catalog";
import { first, pickEnum } from "@/lib/search-params";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Pesanan" };

export default async function OrdersPage(props: PageProps<"/admin/pesanan">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = first(sp.q);
  const verify = first(sp.verifikasi) === "1";
  const status = verify ? undefined : pickEnum(sp.status, ORDER_STATUSES);

  const [rows, sellable, agents, counts] = await Promise.all([
    listOrders({ q, status, awaitingVerification: verify }),
    listSellableProducts(),
    getTreeNodes(),
    getOrderCounts(),
  ]);

  const tab = (label: string, value: (typeof ORDER_STATUSES)[number] | undefined, count: number) => {
    const p = new URLSearchParams();
    if (value) p.set("status", value);
    if (q) p.set("q", q);
    const qs = p.toString();
    return { label, count, active: !verify && status === value, href: qs ? `/admin/pesanan?${qs}` : "/admin/pesanan" };
  };
  const verifyTab = () => {
    const p = new URLSearchParams({ verifikasi: "1" });
    if (q) p.set("q", q);
    return { label: "Perlu verifikasi", count: counts.verify, active: verify, href: `/admin/pesanan?${p}` };
  };

  return (
    <>
      <PageHeader
        title="Pesanan"
        description="Pesanan lewat payment gateway lunas otomatis. Pembayaran QRIS dan transfer manual diperiksa di sini, lalu tandai lunas untuk membagikan komisi."
        actions={
          <CreateOrderDialog
            products={sellable}
            agents={agents}
            trigger={
              <Button disabled={sellable.length === 0}>
                <Plus /> Catat penjualan
              </Button>
            }
          />
        }
      />

      <TabsNav
        label="Status pesanan"
        items={[
          tab("Semua", undefined, counts.all),
          tab("Menunggu", "pending", counts.pending),
          ...(counts.verify > 0 || verify ? [verifyTab()] : []),
          tab("Lunas", "paid", counts.paid),
          tab("Dibatalkan", "cancelled", counts.cancelled),
          tab("Direfund", "refunded", counts.refunded),
        ]}
      />

      <form action="/admin/pesanan" className="flex items-center gap-2 py-4">
        {status && <input type="hidden" name="status" value={status} />}
        {verify && <input type="hidden" name="verifikasi" value="1" />}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <Input name="q" defaultValue={q} placeholder="Cari kode, pelanggan, atau agen" className="pl-9" aria-label="Cari pesanan" />
        </div>
        <Button type="submit" variant="outline">
          Cari
        </Button>
        {q && (
          <Button asChild variant="ghost">
            <Link href={verify ? "/admin/pesanan?verifikasi=1" : status ? `/admin/pesanan?status=${status}` : "/admin/pesanan"}>Reset</Link>
          </Button>
        )}
        <p className="ml-auto hidden text-[0.8125rem] text-muted-foreground sm:block">{rows.length} pesanan</p>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={q || status || verify ? "Tidak ada pesanan yang cocok" : "Belum ada pesanan"}
          description="Klik Catat penjualan untuk menambahkan langganan pertama."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Pesanan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Agen penjual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Bagian Kerjalin</TableHead>
                  <TableHead className="pr-5 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ order: o, sellerName, sellerId, proofId }) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-5">
                      <p className="font-semibold text-navy">{o.productName}</p>
                      <p className="text-[0.8125rem] text-muted-foreground">
                        {o.code} · {formatDate(o.createdAt)} · {o.months} bln
                      </p>
                    </TableCell>
                    <TableCell>
                      {o.customerName}
                      {o.customerPhone && <p className="text-[0.8125rem] text-muted-foreground">{o.customerPhone}</p>}
                    </TableCell>
                    <TableCell>
                      {sellerId ? (
                        <Link href={`/admin/agen/${sellerId}`} className="font-medium text-navy underline-offset-2 hover:underline">
                          {sellerName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Langsung</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                      {o.paymentMethod && (
                        <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                          {PAYMENT_META[o.paymentMethod].label}
                          {o.status === "pending" && o.paymentSubmittedAt && " · perlu verifikasi"}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatIDR(o.amount)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {o.status === "paid" ? formatIDR(o.adminAmount) : "-"}
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-2">
                        {o.paymentMethod === "qris" && (o.paymentSubmittedAt || proofId) && (
                          <PaymentProofDialog
                            id={o.id}
                            code={o.code}
                            status={o.status}
                            amount={o.amount}
                            customerName={o.customerName}
                            proofId={proofId}
                            submittedAt={o.paymentSubmittedAt}
                            note={o.paymentNote}
                          />
                        )}
                        <OrderRowActions id={o.id} code={o.code} status={o.status} amount={o.amount} />
                      </div>
                    </TableCell>
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
