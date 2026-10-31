import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Nada warna dashboard. Navy memimpin untuk sorotan; biru langit, teal, ungu, kuning, dan mawar
 * dipakai sedikit pada ikon, bilah, dan label agar tetap ramah.
 */
export type Tone = "navy" | "sky" | "teal" | "violet" | "amber" | "rose";

export const TONES: Record<Tone, { chip: string; bar: string; tile: string; soft: string; solid: string; ring: string }> = {
  navy: {
    chip: "bg-[#e7ecf7] text-navy",
    bar: "bg-navy",
    tile: "bg-[linear-gradient(135deg,#0d3283_0%,#082052_100%)]",
    soft: "bg-[#eef1f9]",
    solid: "bg-navy hover:bg-navy-soft",
    ring: "border-[#d9e0f0]",
  },
  sky: {
    chip: "bg-[#e3effd] text-[#1f63c4]",
    bar: "bg-[#2f7bd9]",
    tile: "bg-[linear-gradient(135deg,#3a86e0_0%,#1d55a8_100%)]",
    soft: "bg-[#eaf3fe]",
    solid: "bg-[#1f63c4] hover:bg-[#1a54a8]",
    ring: "border-[#cfe2fa]",
  },
  teal: {
    chip: "bg-[#dff4ee] text-[#0c8a73]",
    bar: "bg-[#14a38b]",
    tile: "bg-[linear-gradient(135deg,#1db39a_0%,#0b7a69_100%)]",
    soft: "bg-[#e8f7f3]",
    solid: "bg-[#0c8a73] hover:bg-[#0a7561]",
    ring: "border-[#c6ebe2]",
  },
  violet: {
    chip: "bg-[#ece7fb] text-[#6443d1]",
    bar: "bg-[#7c5ce0]",
    tile: "bg-[linear-gradient(135deg,#8a6bea_0%,#5638b8_100%)]",
    soft: "bg-[#f1eefc]",
    solid: "bg-[#6443d1] hover:bg-[#5538b4]",
    ring: "border-[#ddd4f7]",
  },
  amber: {
    chip: "bg-[#fcefd6] text-[#b06800]",
    bar: "bg-[#e9a23b]",
    tile: "bg-[linear-gradient(135deg,#f2b552_0%,#d7822a_100%)]",
    soft: "bg-[#fdf5e6]",
    solid: "bg-[#c97a12] hover:bg-[#ae680c]",
    ring: "border-[#f6e1b7]",
  },
  rose: {
    chip: "bg-[#fde6ea] text-[#c02a47]",
    bar: "bg-[#e5566d]",
    tile: "bg-[linear-gradient(135deg,#ee6a80_0%,#c02a47_100%)]",
    soft: "bg-[#fdeff1]",
    solid: "bg-[#c02a47] hover:bg-[#a52039]",
    ring: "border-[#f7d0d7]",
  },
};

/* -------------------------------------------------------------------------- */

export type BannerStat = { icon: LucideIcon; label: string; value: ReactNode; hint?: ReactNode };

/** Spanduk sambutan navy dengan empat angka utama dalam kaca buram. */
export function WelcomeBanner({
  title,
  subtitle,
  date,
  actions,
  stats,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  date?: string;
  actions?: ReactNode;
  stats: BannerStat[];
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#0d3283_0%,#082052_55%,#061a45_100%)] p-5 text-white shadow-float sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-white/[0.06]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/3 size-64 rounded-full bg-white/[0.045]" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] leading-tight font-extrabold text-white">{title}</h1>
            {date && <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">{date}</span>}
          </div>
          {subtitle && <p className="mt-2 max-w-2xl text-[0.9375rem] text-white/75">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>

      <dl className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, hint }) => (
          <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-white/15">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <dt className="text-sm text-white/80">{label}</dt>
            </div>
            <dd className="mt-3 text-[1.625rem] leading-none font-extrabold tracking-tight tabular-nums">{value}</dd>
            {hint && <dd className="mt-1.5 text-xs text-white/65">{hint}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

export type Delta = { text: string; trend: "up" | "down" | "flat" };

/** Selisih persen terhadap periode lalu. Null bila periode lalu nol. */
export function deltaPercent(current: number, previous: number): Delta | null {
  if (previous <= 0) return current > 0 ? { text: "Baru", trend: "up" } : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return { text: pct > 999 ? "Melonjak" : `${pct > 0 ? "+" : ""}${pct}%`, trend: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

function DeltaPill({ delta }: { delta: Delta }) {
  const Icon = delta.trend === "down" ? TrendingDown : ArrowUpRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums",
        delta.trend === "up" && "bg-positive/12 text-positive",
        delta.trend === "down" && "bg-negative/10 text-negative",
        delta.trend === "flat" && "bg-muted text-muted-foreground",
      )}
    >
      {delta.trend !== "flat" && <Icon className="size-3.5" aria-hidden />}
      {delta.text}
    </span>
  );
}

/** Kartu angka: ikon berwarna, selisih, angka besar, dan bilah kemajuan. */
export function StatCard({
  icon: Icon,
  tone = "navy",
  label,
  value,
  hint,
  delta,
  progress,
}: {
  icon: LucideIcon;
  tone?: Tone;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: Delta | null;
  progress?: { label: string; percent: number; right?: ReactNode };
}) {
  const t = TONES[tone];
  const percent = progress ? Math.max(0, Math.min(100, Math.round(progress.percent))) : 0;
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-11 place-items-center rounded-xl", t.chip)}>
          <Icon className="size-5" aria-hidden />
        </span>
        {delta && <DeltaPill delta={delta} />}
      </div>
      <p className="mt-4 text-[1.75rem] leading-none font-extrabold tracking-tight text-navy tabular-nums">{value}</p>
      <p className="mt-2 text-sm font-semibold text-navy/85">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      {progress && (
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{progress.label}</span>
            <span className="font-bold text-navy tabular-nums">{progress.right ?? `${percent}%`}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={progress.label}>
            <div className={cn("h-full rounded-full", t.bar)} style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export type ActivityItem = {
  id: string;
  icon: LucideIcon;
  tone: Tone;
  title: ReactNode;
  detail?: ReactNode;
  time: string;
  amount?: ReactNode;
};

/** Daftar kejadian terbaru dengan ikon berwarna. */
export function ActivityList({ items, empty }: { items: ActivityItem[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y divide-border">
      {items.map(({ id, icon: Icon, tone, title, detail, time, amount }) => (
        <li key={id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", TONES[tone].chip)}>
            <Icon className="size-[18px]" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm leading-snug font-semibold text-navy">{title}</span>
            {detail && <span className="mt-0.5 block truncate text-[0.8125rem] text-muted-foreground">{detail}</span>}
            <span className="mt-0.5 block text-xs text-faint">{time}</span>
          </span>
          {amount && <span className="shrink-0 text-sm font-bold tabular-nums">{amount}</span>}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */

export type QuickAction = { href: string; icon: LucideIcon; tone: Tone; title: string; text: string };

/** Ubin aksi cepat berwarna. Dua ubin pertama sebaiknya navy agar sorotan tetap navy. */
export function QuickActions({ items, columns = 2 }: { items: QuickAction[]; columns?: 2 | 4 }) {
  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2", columns === 4 && "lg:grid-cols-4")}>
      {items.map(({ href, icon: Icon, tone, title, text }) => (
        <li key={href + title}>
          <Link
            href={href}
            className={cn(
              "group relative flex h-full min-h-[116px] flex-col overflow-hidden rounded-2xl p-4 text-white shadow-card outline-none transition duration-200 hover:-translate-y-0.5 hover:shadow-float focus-visible:ring-3 focus-visible:ring-navy/40 motion-reduce:transition-none",
              TONES[tone].tile,
            )}
          >
            <span aria-hidden className="absolute -top-8 -right-8 size-24 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-125" />
            <Icon className="relative size-6" aria-hidden />
            <span className="relative mt-auto pt-5">
              <span className="block text-sm font-bold">{title}</span>
              <span className="block text-xs text-white/75">{text}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */

export type PendingItem = {
  href: string;
  icon: LucideIcon;
  tone: Tone;
  count: number | string;
  title: string;
  text: string;
  action: string;
};

/** Kartu tugas yang perlu ditindak: nada lembut, tombol penuh warna. */
export function PendingCards({ items }: { items: PendingItem[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {items.map(({ href, icon: Icon, tone, count, title, text, action }) => {
        const t = TONES[tone];
        return (
          <li key={title} className={cn("flex flex-col rounded-2xl border p-5", t.soft, t.ring)}>
            <div className="flex items-start justify-between gap-3">
              <span className={cn("grid size-11 place-items-center rounded-xl text-white", t.bar)}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className={cn("grid min-w-9 place-items-center rounded-full px-3 py-1 text-sm font-extrabold text-white tabular-nums", t.bar)}>{count}</span>
            </div>
            <p className="mt-4 text-base font-bold text-navy">{title}</p>
            <p className="mt-1 mb-5 text-[0.8125rem] leading-relaxed text-muted-foreground">{text}</p>
            <Link
              href={href}
              className={cn("mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-colors", t.solid)}
            >
              {action}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */

export type RankedItem = {
  id: string;
  rank: number;
  name: string;
  sub: ReactNode;
  value: ReactNode;
  valueHint?: ReactNode;
  href?: string;
  thumb?: ReactNode;
};

const RANK_TONE: Tone[] = ["navy", "sky", "teal", "violet", "amber"];

/** Peringkat: lencana nomor berwarna, nama, dan nilai di kanan. */
export function RankedList({ items, empty }: { items: RankedItem[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="grid gap-2.5">
      {items.map((it) => {
        const body = (
          <>
            <span className="relative shrink-0">
              {it.thumb}
              <span
                className={cn(
                  "absolute -top-1.5 -left-1.5 grid size-5 place-items-center rounded-full text-[0.6875rem] font-extrabold text-white ring-2 ring-white",
                  TONES[RANK_TONE[(it.rank - 1) % RANK_TONE.length]].bar,
                )}
              >
                {it.rank}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-navy">{it.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{it.sub}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-bold text-navy tabular-nums">{it.value}</span>
              {it.valueHint && <span className="block text-xs text-muted-foreground">{it.valueHint}</span>}
            </span>
          </>
        );
        const cls = "flex items-center gap-3 rounded-xl bg-muted p-3 transition-colors";
        return (
          <li key={it.id}>
            {it.href ? (
              <Link href={it.href} className={cn(cls, "hover:bg-accent")}>
                {body}
              </Link>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
