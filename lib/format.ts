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

const longDateFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

/** Tanggal hari ini, mis. "Sabtu, 31 Oktober 2026". */
export function formatToday() {
  return longDateFmt.format(new Date());
}

/** Waktu relatif singkat: "baru saja", "5 menit lalu", "kemarin", atau tanggal untuk yang lebih lama. */
export function formatRelative(value: Date | string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "kemarin";
  if (day < 7) return `${day} hari lalu`;
  return dateFmt.format(d);
}
