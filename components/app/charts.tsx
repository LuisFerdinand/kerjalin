"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompact, formatIDR } from "@/lib/format";

type Series = { key: string; label: string; color: string };

const dayFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });
const tick = (value: string) => dayFmt.format(new Date(`${value}T00:00:00`));

function toConfig(series: Series[]): ChartConfig {
  return Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }]));
}

function TooltipRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex w-full items-center justify-between gap-6">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold text-foreground tabular-nums">{formatIDR(Number(value))}</span>
    </div>
  );
}

function tooltipFormatter(config: ChartConfig) {
  return function formatter(value: unknown, name: unknown) {
    return <TooltipRow label={String(config[String(name)]?.label ?? name)} value={value} />;
  };
}

export function StackedAreaChart({
  data,
  series,
  className,
}: {
  data: Record<string, string | number>[];
  series: Series[];
  className?: string;
}) {
  const config = toConfig(series);
  return (
    <ChartContainer config={config} className={className ?? "aspect-auto h-72 w-full"}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`var(--color-${s.key})`} stopOpacity={0.45} />
              <stop offset="95%" stopColor={`var(--color-${s.key})`} stopOpacity={0.04} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tickFormatter={tick} />
        <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v) => formatCompact(Number(v))} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(v) => tick(String(v))}
              formatter={tooltipFormatter(config) as never}
            />
          }
        />
        {series.map((s) => (
          <Area
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stackId="a"
            stroke={`var(--color-${s.key})`}
            strokeWidth={2}
            fill={`url(#fill-${s.key})`}
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}

export function StackedBarChart({
  data,
  series,
  className,
}: {
  data: Record<string, string | number>[];
  series: Series[];
  className?: string;
}) {
  const config = toConfig(series);
  return (
    <ChartContainer config={config} className={className ?? "aspect-auto h-72 w-full"}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tickFormatter={tick} />
        <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v) => formatCompact(Number(v))} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(v) => tick(String(v))}
              formatter={tooltipFormatter(config) as never}
            />
          }
        />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="a"
            fill={`var(--color-${s.key})`}
            radius={i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  );
}
