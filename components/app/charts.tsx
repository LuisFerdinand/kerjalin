"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompact, formatIDR } from "@/lib/format";

export type Series = { key: string; label: string; color: string };

const dayFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });
const tick = (value: string) => dayFmt.format(new Date(`${value}T00:00:00`));

function toConfig(series: Series[]): ChartConfig {
  return Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }]));
}

function TooltipRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex w-full items-center justify-between gap-6">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{formatIDR(Number(value))}</span>
    </div>
  );
}

function tooltipFormatter(config: ChartConfig) {
  return function formatter(value: unknown, name: unknown) {
    return <TooltipRow label={String(config[String(name)]?.label ?? name)} value={value} />;
  };
}

/** Legenda kecil: satu titik warna + nama, hanya bila ada lebih dari satu seri. */
export function ChartKey({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-muted-foreground">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

const AXIS_TEXT = { fontSize: 12, fill: "#5c6785" };

/** Kolom per hari. Seri pertama = data utama (navy); seri berikutnya memakai warna lebih pucat. */
export function BarsChart({
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
    <ChartContainer config={config} className={className ?? "aspect-auto h-64 w-full"}>
      <BarChart data={data} margin={{ left: 0, right: 4, top: 8 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke="#e3e8f2" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={36}
          tick={AXIS_TEXT}
          tickFormatter={tick}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={46}
          tickCount={5}
          tick={AXIS_TEXT}
          tickFormatter={(v) => formatCompact(Number(v))}
        />
        <ChartTooltip
          cursor={{ fill: "#eef1f8" }}
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
            fill={s.color}
            radius={i === series.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

/** Garis lurus 2px tanpa isian dan tanpa titik. */
export function TrendChart({
  data,
  dataKey,
  label,
  color = "#082052",
  className,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  label: string;
  color?: string;
  className?: string;
}) {
  const config: ChartConfig = { [dataKey]: { label, color } };
  return (
    <ChartContainer config={config} className={className ?? "aspect-auto h-56 w-full"}>
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke="#e3e8f2" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={36}
          tick={AXIS_TEXT}
          tickFormatter={tick}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={46}
          tickCount={5}
          tick={AXIS_TEXT}
          tickFormatter={(v) => formatCompact(Number(v))}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(v) => tick(String(v))}
              formatter={tooltipFormatter(config) as never}
            />
          }
        />
        <Line dataKey={dataKey} type="linear" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ChartContainer>
  );
}
