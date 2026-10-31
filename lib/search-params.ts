/** Mengambil satu nilai string dari searchParams Next.js. */
export function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() ? v.trim() : undefined;
}

export function pickEnum<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | undefined {
  const v = first(value);
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

export function pageParam(value: string | string[] | undefined) {
  const n = Number(first(value));
  return Number.isInteger(n) && n > 0 ? n : 1;
}
