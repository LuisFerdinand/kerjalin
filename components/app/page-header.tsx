import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "blue" | "green" | "amber" | "navy" | "violet";
  className?: string;
}) {
  const toneClass = {
    blue: "bg-brand/10 text-brand",
    green: "bg-success/12 text-success",
    amber: "bg-warning/12 text-warning",
    navy: "bg-navy/10 text-navy",
    violet: "bg-chart-5/12 text-chart-5",
  }[tone];
  return (
    <Card className={cn("gap-3 p-5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex size-9 items-center justify-center rounded-xl", toneClass)}>
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="text-2xl font-extrabold tracking-tight text-navy tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-brand">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 text-base font-bold text-navy">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
