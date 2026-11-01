"use client";

import { CreditCard, QrCode } from "lucide-react";
import type { PaymentMethodKey } from "@/db/schema";
import type { CheckoutMethod } from "@/lib/payments/meta";
import { cn } from "@/lib/utils";

/** Pilihan metode bayar berupa kartu radio. Dipakai di checkout dan di halaman pesanan. */
export function MethodOptions({
  methods,
  value,
  onChange,
  name,
}: {
  methods: CheckoutMethod[];
  value: PaymentMethodKey | null;
  onChange: (key: PaymentMethodKey) => void;
  /** Nama bidang radio. Beda dari bidang form sebenarnya supaya pilihan tidak ikut terkirim dua kali. */
  name: string;
}) {
  return (
    <div role="radiogroup" className="grid gap-2.5">
      {methods.map((m) => {
        const Icon = m.kind === "qris" ? QrCode : CreditCard;
        const checked = m.key === value;
        return (
          <label
            key={m.key}
            className={cn(
              "flex cursor-pointer items-start gap-3.5 rounded-xl border-2 p-4 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-navy/25",
              checked ? "border-navy bg-muted" : "border-border hover:border-navy/40",
            )}
          >
            <input type="radio" name={name} value={m.key} checked={checked} onChange={() => onChange(m.key)} className="sr-only" />
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", checked ? "bg-navy text-white" : "bg-muted text-navy")}>
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-navy">
                {m.kind === "qris" ? "QRIS" : `Bayar online · ${m.label}`}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
                    m.kind === "qris" ? "bg-warning/15 text-warning" : "bg-positive/15 text-positive",
                  )}
                >
                  {m.kind === "qris" ? "Dicek admin" : "Otomatis"}
                </span>
              </span>
              <span className="mt-0.5 block text-[0.8125rem] text-muted-foreground">{m.description}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
