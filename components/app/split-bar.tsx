import { formatIDR } from "@/lib/format";

export type SplitSegment = { label: string; value: number; color: string; note?: string };

/**
 * Satu batang 100% dengan jeda 2px, lalu tabel kecil: titik warna, nama, jumlah, persen.
 * Setiap titik legenda adalah penanda yang sama dengan segmen di batang.
 */
export function SplitBar({ segments, empty }: { segments: SplitSegment[]; empty?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total <= 0) {
    return <p className="rounded-lg bg-muted/60 px-4 py-6 text-sm text-muted-foreground">{empty ?? "Belum ada data."}</p>;
  }
  return (
    <div className="grid gap-4">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-[3px]" role="img" aria-label={segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(", ")}>
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <span key={s.label} style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }} />
          ))}
      </div>
      <ul className="grid gap-2.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: s.color }} aria-hidden />
            <span className="flex-1 text-navy">
              {s.label}
              {s.note && <span className="block text-[0.8125rem] text-muted-foreground">{s.note}</span>}
            </span>
            <span className="font-medium tabular-nums text-navy">{formatIDR(s.value)}</span>
            <span className="w-11 text-right tabular-nums text-muted-foreground">{((s.value / total) * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
