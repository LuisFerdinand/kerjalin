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
import { ORDER_STATUSES } from "@/db/schema";
import { formatDate, formatIDR } from "@/lib/format";
import { getOrderCounts, getTreeNodes, listOrders } from "@/lib/queries/admin";
import { listSellableProducts } from "@/lib/queries/catalog";
import { first, pickEnum } from "@/lib/search-params";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Pesanan" };

export default async function OrdersPage(props: PageProps<"/admin/pesanan">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = first(sp.q);
  const status = pickEnum(sp.status, ORDER_STATUSES);

  const [rows, sellable, agents, counts] = await Promise.all([
    listOrders({ q, status }),
    listSellableProducts(),
    getTreeNodes(),
    getOrderCounts(),
  ]);

  const tab = (label: string, value: (typeof ORDER_STATUSES)[number] | undefined, count: number) => {
    const p = new URLSearchParams();
    if (value) p.set("status", value);
    if (q) p.set("q", q);
    const qs = p.toString();
    return { label, count, active: status === value, href: qs ? `/admin/pesanan?${qs}` : "/admin/pesanan" };
  };

  return (
    <>
      <PageHeader
        title="Pesanan"
        description="Catat langganan dan tandai lunas untuk membagikan komisi. Nantinya terhubung ke pembayaran otomatis."
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
          tab("Lunas", "paid", counts.paid),
          tab("Dibatalkan", "cancelled", counts.cancelled),
          tab("Direfund", "refunded", counts.refunded),
        ]}
      />

      <form action="/admin/pesanan" className="flex items-center gap-2 py-4">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <Input name="q" defaultValue={q} placeholder="Cari kode, pelanggan, atau agen" className="pl-9" aria-label="Cari pesanan" />
        </div>
        <Button type="submit" variant="outline">
          Cari
        </Button>
        {q && (
          <Button asChild variant="ghost">
            <Link href={status ? `/admin/pesanan?status=${status}` : "/admin/pesanan"}>Reset</Link>
          </Button>
        )}
        <p className="ml-auto hidden text-[0.8125rem] text-muted-foreground sm:block">{rows.length} pesanan</p>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={q || status ? "Tidak ada pesanan yang cocok" : "Belum ada pesanan"}
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
                {rows.map(({ order: o, sellerName, sellerId }) => (
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
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatIDR(o.amount)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {o.status === "paid" ? formatIDR(o.adminAmount) : "-"}
                    </TableCell>
                    <TableCell className="pr-5">
                      <OrderRowActions id={o.id} code={o.code} status={o.status} amount={o.amount} />
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
