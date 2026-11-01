"use client";

import { ScanEye } from "lucide-react";
import { OrderRowActions } from "@/components/admin/order-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { OrderStatus } from "@/db/schema";
import { formatDateTime, formatIDR } from "@/lib/format";

/**
 * Pemeriksaan pembayaran QRIS: bukti dari pelanggan, nominal, dan tombol tandai lunas dalam satu dialog,
 * supaya admin bisa mencocokkan dengan mutasi lalu langsung memutuskan.
 */
export function PaymentProofDialog({
  id,
  code,
  status,
  amount,
  customerName,
  proofId,
  submittedAt,
  note,
}: {
  id: string;
  code: string;
  status: OrderStatus;
  amount: number;
  customerName: string;
  proofId: string | null;
  submittedAt: Date | null;
  note: string | null;
}) {
  const awaiting = status === "pending" && submittedAt !== null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant={awaiting ? "default" : "outline"}>
          <ScanEye /> {awaiting ? "Verifikasi" : "Bukti"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold text-navy">Pembayaran QRIS {code}</DialogTitle>
          <DialogDescription>
            {customerName} · {formatIDR(amount)}. Cocokkan dengan mutasi rekening atau e-wallet sebelum menandai lunas.
          </DialogDescription>
        </DialogHeader>

        {proofId ? (
          <div className="overflow-hidden rounded-xl border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- bukti dari database, hanya bisa dibuka admin */}
            <img src={`/api/payments/proof/${proofId}`} alt={`Bukti bayar ${code}`} className="max-h-[55vh] w-full object-contain" />
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
            {submittedAt ? "Pelanggan mengirim konfirmasi tanpa melampirkan bukti." : "Pelanggan belum mengirim konfirmasi."}
          </p>
        )}

        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Konfirmasi dikirim</dt>
            <dd className="font-medium">{submittedAt ? formatDateTime(submittedAt) : "-"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Nama pengirim</dt>
            <dd className="text-right font-medium">{note || "-"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <dt className="font-semibold text-navy">Nominal yang harus masuk</dt>
            <dd className="font-extrabold text-navy tabular-nums">{formatIDR(amount)}</dd>
          </div>
        </dl>

        <DialogFooter className="sm:justify-end">
          <OrderRowActions id={id} code={code} status={status} amount={amount} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
