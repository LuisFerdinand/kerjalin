"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Coins } from "lucide-react";
import { formatIDR } from "@/lib/format";
import type { DisplayPlan } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Pilih lama langganan. Total, harga per bulan, hemat, dan komisi agen untuk paket terpilih
 * dihitung ulang saat pilihan berganti.
 */
export function PlanPicker({
  plans,
  commissionPercent,
  commissionLabel,
  checkoutHref,
  ctaLabel = "Pesan Sekarang",
}: {
  plans: DisplayPlan[];
  commissionPercent: number;
  /** Mis. "Komisi kamu (Agen Utama)" atau "Komisi agen hingga". */
  commissionLabel: string;
  /** Halaman checkout produk ini. Paket terpilih dikirim lewat ?paket=. */
  checkoutHref: string;
  ctaLabel?: string;
}) {
  const [selected, setSelected] = useState(0);
  const plan = plans[selected] ?? plans[0];
  if (!plan) return null;
  const commission = Math.floor((plan.price * commissionPercent) / 100);

  return (
    <div className="grid gap-4">
      <fieldset>
        <legend className="mb-3 text-sm font-bold text-navy">Pilih lama langganan</legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {plans.map((pl, i) => (
            <label
              key={pl.months}
              className={cn(
                "relative flex cursor-pointer flex-col rounded-xl border-2 p-3 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-navy/25",
                i === selected ? "border-navy bg-muted" : "border-border bg-white hover:border-navy/40",
              )}
            >
              <input type="radio" name="plan" value={pl.months} checked={i === selected} onChange={() => setSelected(i)} className="sr-only" />
              <span className="text-sm font-bold text-navy">{pl.label}</span>
              <span className="mt-0.5 text-xs text-muted-foreground tabular-nums">{formatIDR(pl.perMonth)}/bln</span>
              {pl.saving > 0 && (
                <span className="mt-2 w-fit rounded-full bg-positive/15 px-2 py-0.5 text-[0.6875rem] font-bold text-positive">Hemat {pl.saving}%</span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rounded-2xl border border-border bg-muted p-4 sm:p-5" aria-live="polite">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total paket {plan.label.toLowerCase()}</p>
            <p className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-navy tabular-nums">{formatIDR(plan.price)}</p>
          </div>
          <p className="pb-1 text-xs text-muted-foreground tabular-nums">{formatIDR(plan.perMonth)} per bulan</p>
        </div>
        {commissionPercent > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-navy px-4 py-3 text-white">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Coins className="size-4" aria-hidden />
              {commissionLabel}
            </span>
            <span className="text-base font-extrabold tabular-nums">{formatIDR(commission)}</span>
          </div>
        )}
      </div>

      <Link
        href={`${checkoutHref}?paket=${plan.months}`}
        className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-navy px-6 text-base font-semibold text-white shadow-float transition-colors hover:bg-navy-soft"
      >
        {ctaLabel}
        <ArrowRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}
