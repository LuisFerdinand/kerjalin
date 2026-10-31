"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle2, Loader2, Undo2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialog } from "@/components/forms/form-dialog";
import { FormField } from "@/components/forms/form-field";
import { AgentCombobox } from "@/components/admin/agent-combobox";
import {
  cancelOrderAction,
  createOrderAction,
  markOrderPaidAction,
  refundOrderAction,
} from "@/app/admin/pesanan/actions";
import { formatIDR } from "@/lib/format";
import type { TreeNodeData } from "@/lib/queries/admin";
import type { OrderStatus } from "@/db/schema";

type SellableProduct = {
  id: string;
  name: string;
  priceMonthly: number;
  pricingPlans: { months: number; price: number; label?: string }[];
};

/** Paket yang bisa dipilih: paket produk, atau bulanan otomatis bila belum ada paket. */
function plansOf(p: SellableProduct) {
  return p.pricingPlans.length > 0
    ? p.pricingPlans.map((pl) => ({ ...pl, label: pl.label || `${pl.months} bulan` }))
    : [{ months: 1, price: p.priceMonthly, label: "Bulanan" }];
}

export function CreateOrderDialog({
  products,
  agents,
  trigger,
}: {
  products: SellableProduct[];
  agents: TreeNodeData[];
  trigger: ReactNode;
}) {
  const [productId, setProductId] = useState(products[0]?.id);
  const product = products.find((p) => p.id === productId);
  const plans = product ? plansOf(product) : [];
  const [planIndex, setPlanIndex] = useState("0");
  const plan = plans[Number(planIndex)] ?? plans[0];
  const [months, setMonths] = useState(String(plan?.months ?? 1));
  const [amount, setAmount] = useState(String(plan?.price ?? ""));

  function pickProduct(id: string) {
    setProductId(id);
    const next = products.find((p) => p.id === id);
    const first = next ? plansOf(next)[0] : undefined;
    setPlanIndex("0");
    setMonths(String(first?.months ?? 1));
    setAmount(String(first?.price ?? ""));
  }

  function pickPlan(value: string) {
    setPlanIndex(value);
    const next = plans[Number(value)];
    if (next) {
      setMonths(String(next.months));
      setAmount(String(next.price));
    }
  }

  return (
    <FormDialog
      title="Catat penjualan"
      description="Catat langganan baru. Saat ditandai lunas, komisi agen dan bonus tim dibagikan otomatis."
      trigger={trigger}
      action={createOrderAction}
      submitLabel="Catat penjualan"
      size="lg"
    >
      {(state) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Produk" name="productId" state={state}>
              <Select name="productId" value={productId} onValueChange={pickProduct}>
                <SelectTrigger id="productId" className="w-full">
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Paket langganan" name="plan" hint="Mengisi lama dan total harga di bawah.">
              <Select value={planIndex} onValueChange={pickPlan}>
                <SelectTrigger id="plan" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((pl, i) => (
                    <SelectItem key={pl.months} value={String(i)}>
                      {pl.label} · {formatIDR(pl.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Agen penjual" name="agentId" state={state}>
            <AgentCombobox
              name="agentId"
              nodes={agents.filter((a) => a.status === "active")}
              rootLabel="Penjualan langsung (tanpa agen)"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nama pelanggan / usaha" name="customerName" state={state}>
              <Input id="customerName" name="customerName" required />
            </FormField>
            <FormField label="WhatsApp pelanggan" name="customerPhone" state={state}>
              <Input id="customerPhone" name="customerPhone" type="tel" />
            </FormField>
          </div>

          <FormField label="Email pelanggan" name="customerEmail" state={state}>
            <Input id="customerEmail" name="customerEmail" type="email" />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Lama langganan (bulan)" name="months" state={state}>
              <Input
                id="months"
                name="months"
                type="number"
                min={1}
                max={36}
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                required
                className="tabular-nums"
              />
            </FormField>
            <FormField label="Total dibayar (Rp)" name="amount" state={state} hint="Ubah bila ada diskon khusus.">
              <Input
                id="amount"
                name="amount"
                type="number"
                min={0}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tabular-nums"
              />
            </FormField>
          </div>

          <FormField label="Catatan" name="note" state={state}>
            <Input id="note" name="note" />
          </FormField>

          <label className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/50 p-3.5">
            <span>
              <span className="block text-sm font-semibold text-navy">Sudah dibayar (lunas)</span>
              <span className="block text-[0.8125rem] text-muted-foreground">
                Aktifkan agar komisi langsung dibagikan ke agen dan upline.
              </span>
            </span>
            <Switch name="markPaid" defaultChecked />
          </label>
        </>
      )}
    </FormDialog>
  );
}

/* -------------------------------------------------------------------------- */

function ConfirmButton({
  trigger,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm();
              setBusy(false);
            }}
          >
            {busy && <Loader2 className="animate-spin" />} {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

async function exec(fn: (id: string) => Promise<{ ok: boolean; message?: string; error?: string } | null>, id: string) {
  const res = await fn(id);
  if (res?.ok) toast.success(res.message);
  else toast.error(res?.error ?? "Terjadi kesalahan");
}

export function OrderRowActions({ id, code, status, amount }: { id: string; code: string; status: OrderStatus; amount: number }) {
  if (status === "pending") {
    return (
      <div className="flex justify-end gap-2">
        <ConfirmButton
          title={`Tandai ${code} lunas?`}
          description={`Pembayaran ${formatIDR(amount)} dianggap diterima dan komisi langsung dibagikan ke agen serta upline-nya.`}
          confirmLabel="Ya, tandai lunas"
          onConfirm={() => exec(markOrderPaidAction, id)}
          trigger={
            <Button size="sm">
              <CheckCircle2 /> Lunas
            </Button>
          }
        />
        <ConfirmButton
          title={`Batalkan ${code}?`}
          description="Pesanan yang belum dibayar akan dibatalkan. Tidak ada komisi yang dibagikan."
          confirmLabel="Batalkan pesanan"
          destructive
          onConfirm={() => exec(cancelOrderAction, id)}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Batalkan pesanan">
              <XCircle className="text-destructive" />
            </Button>
          }
        />
      </div>
    );
  }
  if (status === "paid") {
    return (
      <div className="flex justify-end">
        <ConfirmButton
          title={`Refund ${code}?`}
          description="Semua komisi dan bonus tim dari pesanan ini akan dibatalkan dan saldo agen dikurangi. Saldo bisa menjadi negatif bila sudah ditarik."
          confirmLabel="Ya, refund"
          destructive
          onConfirm={() => exec(refundOrderAction, id)}
          trigger={
            <Button size="sm" variant="outline">
              <Undo2 /> Refund
            </Button>
          }
        />
      </div>
    );
  }
  return null;
}
