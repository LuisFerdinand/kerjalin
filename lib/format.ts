const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

export function formatIDR(value: number | string | null | undefined) {
  return idr.format(Number(value ?? 0));
}

export function formatCompact(value: number) {
  return compact.format(value);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return dateFmt.format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";
  return dateTimeFmt.format(new Date(value));
}

/** Persen dari kolom numeric (string) atau number, tanpa nol di belakang koma. */
export function formatPercent(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `${Number.isInteger(n) ? n : n.toFixed(2).replace(/0+$/, "")}%`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
