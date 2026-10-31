import type { PricingPlan } from "@/db/schema";

type PriceSource = { priceMonthly: number; pricingPlans: PricingPlan[] };

export type DisplayPlan = {
  months: number;
  label: string;
  price: number;
  perMonth: number;
  /** Persen hemat dibanding membayar bulanan, 0 bila tidak ada. */
  saving: number;
};

/** Paket untuk ditampilkan: paket produk, atau satu paket bulanan bila belum ada. */
export function displayPlans(p: PriceSource): DisplayPlan[] {
  const base = p.priceMonthly;
  const plans = p.pricingPlans.length > 0 ? p.pricingPlans : [{ months: 1, price: base, label: "Bulanan" }];
  return [...plans]
    .sort((a, b) => a.months - b.months)
    .map((pl) => {
      const perMonth = Math.round(pl.price / pl.months);
      const saving = base > 0 ? Math.max(0, Math.round((1 - perMonth / base) * 100)) : 0;
      return {
        months: pl.months,
        label: pl.label || (pl.months === 1 ? "Bulanan" : pl.months === 12 ? "Tahunan" : `${pl.months} bulan`),
        price: pl.price,
        perMonth,
        saving,
      };
    });
}

/** Penghematan terbesar di antara paket, untuk keterangan singkat di daftar produk. */
export function bestSaving(p: PriceSource) {
  const plans = displayPlans(p);
  return plans.reduce<DisplayPlan | null>((best, pl) => (pl.saving > (best?.saving ?? 0) ? pl : best), null);
}
