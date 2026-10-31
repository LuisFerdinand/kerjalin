import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ReceiptText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/app/badges";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { CreateOrderDialog, OrderRowActions } from "@/components/admin/order-actions";
import { ORDER_STATUSES } from "@/db/schema";
import { formatDate, formatIDR } from "@/lib/format";
import { getTreeNodes, listOrders, listProductsAdmin } from "@/lib/queries/admin";
import { first, pickEnum } from "@/lib/search-params";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Pesanan" };

export default async function OrdersPage(props: PageProps<"/admin/pesanan">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = first(sp.q);
  const status = pickEnum(sp.status, ORDER_STATUSES);

  const [rows, productList, agents] = await Promise.all([
    listOrders({ q, status }),
    listProductsAdmin(),
    getTreeNodes(),
  ]);
  const sellable = productList.filter((p) => p.status === "active" || p.status === "coming_soon");
  const hasFilters = Boolean(q || status);

  return (
    <>
      <PageHeader
        title="Pesanan"
        description="Catat penjualan layanan dan tandai lunas untuk membagikan komisi. Nantinya terhubung ke sistem pembayaran otomatis."
        actions={
          <CreateOrderDialog
            products={sellable.map((p) => ({ id: p.id, name: p.name, priceMonthly: p.priceMonthly }))}
            agents={agents}
            trigger={
              <Button disabled={sellable.length === 0}>
                <Plus /> Catat penjualan
              </Button>
            }
          />
        }
      />

      <Card className="gap-0 overflow-hidden p-0">
        <form action="/admin/pesanan" className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Cari kode, pelanggan, atau agen..." className="h-10 pl-9" />
          </div>
          <NativeSelect name="status" defaultValue={status ?? ""} className="sm:w-48" aria-label="Status">
            <option value="">Semua status</option>
            <option value="pending">Menunggu</option>
            <option value="paid">Lunas</option>
            <option value="cancelled">Dibatalkan</option>
            <option value="refunded">Direfund</option>
          </NativeSelect>
          <Button type="submit">Terapkan</Button>
          {hasFilters && (
            <Button asChild variant="ghost">
              <Link href="/admin/pesanan">Reset</Link>
            </Button>
          )}
        </form>

        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ReceiptText}
              title={hasFilters ? "Tidak ada pesanan yang cocok" : "Belum ada pesanan"}
              description="Klik “Catat penjualan” untuk menambahkan langganan pertama."
            />
          </div>
        ) : (
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
                      <p className="text-xs text-muted-foreground">
                        {o.code} · {formatDate(o.createdAt)} · {o.months} bln
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {o.customerName}
                      {o.customerPhone && <p className="text-xs text-muted-foreground">{o.customerPhone}</p>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {sellerId ? (
                        <Link href={`/admin/agen/${sellerId}`} className="font-medium text-brand hover:underline">
                          {sellerName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Langsung</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatIDR(o.amount)}</TableCell>
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
        )}
      </Card>
    </>
  );
}
