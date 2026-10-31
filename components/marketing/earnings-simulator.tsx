"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PublicLevel } from "./levels-section";

function Control({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-navy">{label}</span>
        <span className="rounded-lg bg-muted px-2.5 py-1 text-sm font-bold text-navy tabular-nums">
          {value} {suffix}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={(v) => onChange(v[0] ?? min)} aria-label={label} />
    </div>
  );
}

/** Simulasi penghasilan bulanan: pengunjung mengatur angka, hasilnya langsung dihitung ulang. */
export function EarningsSimulator({ levels, price }: { levels: PublicLevel[]; price: number }) {
  const [levelId, setLevelId] = useState(levels[0]?.id);
  const [customers, setCustomers] = useState(10);
  const [members, setMembers] = useState(3);
  const [perMember, setPerMember] = useState(5);

  const level = levels.find((l) => l.id === levelId) ?? levels[0];
  const commission = Number(level.commissionPercent);
  const bonus = level.overridePercents.map(Number);
  const bonus1 = bonus[0] ?? 0;

  const own = Math.floor((customers * price * commission) / 100);
  const team = bonus1 > 0 ? Math.floor((members * perMember * price * bonus1) / 100) : 0;
  const total = own + team;

  return (
    <section id="simulasi" className="scroll-mt-24 pb-16 lg:pb-24">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-[2rem] border border-border bg-muted p-6 sm:p-8 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-14 lg:p-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-navy shadow-sm">
              <Calculator className="size-4" aria-hidden />
              Simulasi Penghasilan
            </span>
            <h2 className="mt-4 max-w-[18ch] text-[clamp(1.75rem,3.2vw,2.5rem)] leading-tight font-extrabold text-balance text-navy">
              Hitung sendiri komisimu
            </h2>
            <p className="mt-3 max-w-[46ch] text-muted-foreground">
              Pilih level, lalu geser jumlah pelanggan. Hasilnya dihitung ulang langsung dengan produk seharga {formatIDR(price)}{" "}
              per bulan.
            </p>

            <div className="mt-8 grid gap-7">
              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-navy">Level agen</legend>
                <div className="flex flex-wrap gap-2">
                  {levels.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLevelId(l.id)}
                      aria-pressed={l.id === level.id}
                      className={cn(
                        "rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors",
                        l.id === level.id ? "border-navy bg-navy text-white" : "border-input bg-white text-navy hover:border-navy",
                      )}
                    >
                      {l.name}
                      <span className="block text-xs font-medium opacity-75">Komisi {Number(l.commissionPercent)}%</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <Control label="Pelanggan dari penjualanmu" value={customers} min={0} max={100} onChange={setCustomers} suffix="pelanggan" />
              {bonus1 > 0 && (
                <>
                  <Control label="Anggota tim langsung" value={members} min={0} max={10} onChange={setMembers} suffix="orang" />
                  <Control label="Pelanggan per anggota tim" value={perMember} min={0} max={30} onChange={setPerMember} suffix="pelanggan" />
                </>
              )}
            </div>
          </div>

          <div className="self-start rounded-2xl bg-white p-6 shadow-float sm:p-8 lg:sticky lg:top-24" aria-live="polite">
            <p className="text-sm font-bold text-navy">Estimasi per bulan</p>
            <p className="text-xs text-muted-foreground">{level.name} · contoh perhitungan</p>

            <dl className="mt-6 grid gap-4 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">
                  {customers} pelanggan × {formatIDR(price)}
                </dt>
                <dd className="font-medium tabular-nums">{formatIDR(customers * price)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">Komisi penjualan {commission}%</dt>
                <dd className="font-bold text-navy tabular-nums">{formatIDR(own)}</dd>
              </div>
              {bonus1 > 0 && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">
                    Bonus tim tingkat 1 ({bonus1}%)
                    <span className="block text-xs">
                      {members} anggota × {perMember} pelanggan
                    </span>
                  </dt>
                  <dd className="font-bold text-navy tabular-nums">{formatIDR(team)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6 rounded-2xl bg-navy p-5 text-white">
              <p className="text-xs text-white/75">Total per bulan</p>
              <p className="mt-1 text-[clamp(1.75rem,3.4vw,2.5rem)] leading-none font-extrabold tracking-tight tabular-nums">{formatIDR(total)}</p>
              <p className="mt-2 text-xs text-white/75 tabular-nums">sekitar {formatIDR(total * 12)} per tahun</p>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              Hanya gambaran untuk memahami skema komisi, bukan jaminan penghasilan. Hasil nyata bergantung pada usahamu.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
