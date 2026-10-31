import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Judul halaman: kata benda, satu kalimat penjelas, dan aksi nyata di kanan. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[0.9375rem] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export type KpiItem = {
  label: string;
  value: ReactNode;
  /** Satuan atau pembanding, ditulis lengkap dengan acuannya. */
  hint?: ReactNode;
  /** Angka jawaban utama layar: sedikit lebih besar dari saudaranya. */
  lead?: boolean;
};

/** Beberapa angka dalam satu wadah, dibagi garis tipis. Tanpa ikon, tanpa sparkline. */
export function KpiStrip({ items, className }: { items: KpiItem[]; className?: string }) {
  const cols =
    items.length >= 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : items.length === 3
        ? "sm:grid-cols-3"
        : items.length === 2
          ? "sm:grid-cols-2"
          : "";
  return (
    <dl
      className={cn(
        "grid divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card sm:divide-y-0 sm:divide-x lg:divide-x",
        cols,
        className,
      )}
    >
      {items.map((it) => (
        <div key={it.label} className="px-5 py-4">
          <dt className="text-[0.8125rem] text-muted-foreground">{it.label}</dt>
          <dd className={cn("mt-1 font-semibold tabular-nums text-navy", it.lead ? "text-[1.875rem]" : "text-[1.5rem]")}>
            {it.value}
          </dd>
          {it.hint && <dd className="mt-0.5 text-[0.8125rem] text-muted-foreground">{it.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** Kartu putih bergaris tipis dengan judul. `flush` membuang padding isi (untuk tabel). */
export function Panel({
  title,
  description,
  action,
  flush,
  className,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  flush?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-card", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5 pb-3">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-navy">{title}</h2>}
            {description && <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={flush ? "" : "px-5 pb-5"}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-input px-6 py-12 text-center">
      <Icon className="size-6 text-faint" />
      <h3 className="mt-3 text-[0.9375rem] font-semibold text-navy">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
