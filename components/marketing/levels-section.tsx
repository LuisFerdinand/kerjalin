import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { getPublicLevels } from "@/lib/queries/public";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export type PublicLevel = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  commissionPercent: string | number;
  overridePercents: number[];
  maxDownlines?: number | null;
};

/** Cadangan bila database belum bisa dibaca. */
export const fallbackLevels: PublicLevel[] = [
  { id: "1", name: "Agen Utama", color: "#B36B00", description: "Komisi terbesar dan bonus dari dua tingkat tim.", commissionPercent: 50, overridePercents: [10, 5] },
  { id: "2", name: "Agen Reseller", color: "#082052", description: "Boleh merekrut Sub-Agen dan mendapat bonus tim.", commissionPercent: 40, overridePercents: [10] },
  { id: "3", name: "Sub-Agen", color: "#6B7A9E", description: "Fokus menjual langsung ke pelanggan.", commissionPercent: 35, overridePercents: [] },
];

export async function loadPublicLevels(): Promise<PublicLevel[]> {
  const levels = await getPublicLevels();
  return levels.length ? levels : fallbackLevels;
}

/** Persen komisi tertinggi di antara level. */
export function topCommissionOf(levels: PublicLevel[]) {
  return Math.max(0, ...levels.map((l) => Number(l.commissionPercent)));
}

const COLS: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3" };

/** Kartu level. Level tertinggi (rank 1) tampil navy sebagai sorotan. */
export function LevelTiles({ levels }: { levels: PublicLevel[] }) {
  const cols = COLS[levels.length] ?? "lg:grid-cols-4";

  return (
    <section id="keuntungan" className="scroll-mt-24 py-16 lg:py-24">
      <span id="komisi" className="sr-only" />
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-[44rem] text-center">
          <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] leading-tight font-extrabold text-balance text-navy">
            Makin tinggi levelmu, makin besar komisimu
          </h2>
          <p className="mt-3 text-muted-foreground">
            Setiap agen mendapat komisi dari penjualannya sendiri. Agen yang membangun tim juga mendapat bonus tim dari
            penjualan downline-nya.
          </p>
        </Reveal>

        <ul className={cn("mt-10 grid gap-5 md:grid-cols-2", cols)}>
          {levels.map((lvl, i) => {
            const top = i === 0 && levels.length > 1;
            return (
              <li key={lvl.id}>
                <Reveal delay={i * 0.08} className="h-full">
                  <div
                    className={cn(
                      "relative flex h-full flex-col rounded-2xl border p-7 shadow-card",
                      top ? "border-navy bg-navy text-white shadow-float" : "border-border bg-white text-navy",
                    )}
                  >
                    {top && (
                      <span className="absolute -top-3 left-7 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-navy shadow-sm ring-1 ring-border">
                        <Crown className="size-3.5" aria-hidden />
                        Komisi Tertinggi
                      </span>
                    )}
                    <h3 className="text-lg font-bold">{lvl.name}</h3>
                    <p className="mt-4 text-5xl leading-none font-extrabold tracking-tight tabular-nums">{formatPercent(lvl.commissionPercent)}</p>
                    <p className={cn("mt-2 text-sm", top ? "text-white/75" : "text-muted-foreground")}>komisi dari tiap penjualanmu</p>

                    <ul className={cn("mt-6 grid gap-3 border-t pt-6 text-sm", top ? "border-white/15" : "border-border")}>
                      {lvl.overridePercents.length > 0 ? (
                        lvl.overridePercents.map((p, k) => (
                          <li key={k} className="flex items-start gap-3">
                            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                            Bonus tim tingkat {k + 1}: {formatPercent(p)}
                          </li>
                        ))
                      ) : (
                        <li className="flex items-start gap-3">
                          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                          Fokus menjual langsung
                        </li>
                      )}
                      {lvl.description && (
                        <li className="flex items-start gap-3">
                          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                          {lvl.description}
                        </li>
                      )}
                    </ul>

                    <Link
                      href="/daftar"
                      className={cn(
                        "mt-8 inline-flex h-12 items-center justify-center rounded-xl text-sm font-semibold transition-colors",
                        top ? "mt-auto bg-white text-navy hover:bg-white/90" : "mt-auto border border-input bg-white text-navy hover:border-navy",
                      )}
                    >
                      Daftar gratis
                    </Link>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>

        <p className="mx-auto mt-6 max-w-[60ch] text-center text-sm text-muted-foreground">
          Level awalmu ditentukan Kerjalin atau sponsor yang mengajakmu. Persentase bisa berubah sewaktu-waktu dan selalu
          terlihat di dashboard agen.
        </p>
      </div>
    </section>
  );
}
