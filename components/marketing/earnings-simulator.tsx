"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion";
import { Calculator, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatIDR } from "@/lib/format";
import type { PublicLevel } from "./commission-section";
import { cn } from "@/lib/utils";

function AnimatedIDR({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(prev.current, value, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (v) => {
        node.textContent = formatIDR(Math.round(v));
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {formatIDR(value)}
    </span>
  );
}

function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold text-navy">{label}</label>
        <span className="rounded-md bg-accent px-2 py-0.5 text-sm font-bold text-navy tabular-nums">
          {display}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? min)}
        aria-label={label}
      />
    </div>
  );
}

export function EarningsSimulator({ levels }: { levels: PublicLevel[] }) {
  const [levelId, setLevelId] = useState(levels[0]?.id);
  const [price, setPrice] = useState(100_000);
  const [customers, setCustomers] = useState(10);
  const [members, setMembers] = useState(3);
  const [perMember, setPerMember] = useState(5);

  const level = levels.find((l) => l.id === levelId) ?? levels[0];
  const commission = Number(level.commissionPercent);
  const bonus1 = Number(level.overridePercents[0] ?? 0);

  const direct = Math.floor((customers * price * commission) / 100);
  const team = Math.floor((members * perMember * price * bonus1) / 100);
  const total = direct + team;

  return (
    <section id="simulasi" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-bold tracking-widest text-brand uppercase">
            <Calculator className="size-4" /> Simulasi
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-balance text-navy sm:text-4xl">
            Hitung potensi komisimu
          </h2>
          <p className="mt-4 text-lg text-navy/70">
            Geser angka di bawah untuk melihat gambaran penghasilan bulanan berdasarkan level dan
            jumlah pelanggan.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-7 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="grid gap-3">
              <span className="text-sm font-semibold text-navy">Level agen</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {levels.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLevelId(l.id)}
                    aria-pressed={l.id === level.id}
                    className={cn(
                      "rounded-xl border-2 px-3 py-2.5 text-left transition-all",
                      l.id === level.id
                        ? "border-brand bg-brand-soft"
                        : "border-border bg-background hover:border-brand/40",
                    )}
                  >
                    <span className="block text-sm font-bold text-navy">{l.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Komisi {Number(l.commissionPercent)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <SliderRow
              label="Harga layanan per bulan"
              value={price}
              display={formatIDR(price)}
              min={50_000}
              max={300_000}
              step={5_000}
              onChange={setPrice}
            />
            <SliderRow
              label="Pelanggan yang kamu dapatkan sendiri"
              value={customers}
              display={`${customers} pelanggan`}
              min={0}
              max={100}
              onChange={setCustomers}
            />
            {bonus1 > 0 && (
              <>
                <SliderRow
                  label="Anggota tim langsung"
                  value={members}
                  display={`${members} orang`}
                  min={0}
                  max={10}
                  onChange={setMembers}
                />
                <SliderRow
                  label="Rata-rata pelanggan per anggota tim"
                  value={perMember}
                  display={`${perMember} pelanggan`}
                  min={0}
                  max={30}
                  onChange={setPerMember}
                />
              </>
            )}
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-xl shadow-navy/20 sm:p-8">
            <div className="absolute -top-24 -right-16 size-64 rounded-full bg-brand/30 blur-3xl" aria-hidden />
            <div className="relative">
              <p className="text-sm font-medium text-cream/70">Estimasi penghasilan per bulan</p>
              <AnimatedIDR
                value={total}
                className="mt-2 block text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl"
              />
              <p className="mt-1 text-sm text-cream/60">
                ≈ <AnimatedIDR value={total * 12} /> per tahun
              </p>

              <dl className="mt-8 grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-white/8 px-4 py-3">
                  <dt className="text-cream/80">
                    Komisi penjualan ({Number(level.commissionPercent)}%)
                  </dt>
                  <dd className="font-bold tabular-nums">{formatIDR(direct)}</dd>
                </div>
                {bonus1 > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-white/8 px-4 py-3">
                    <dt className="text-cream/80">Bonus tim tingkat 1 ({bonus1}%)</dt>
                    <dd className="font-bold tabular-nums">{formatIDR(team)}</dd>
                  </div>
                )}
              </dl>

              <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-cream/60">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                Simulasi hanya ilustrasi untuk memahami skema komisi, bukan jaminan atau janji
                penghasilan. Hasil nyata bergantung pada usahamu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
