import { z } from "zod";

/** Bentuk hasil server action yang dipakai seluruh form. */
export type ActionState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export function fail(error: string, fieldErrors?: Record<string, string>): NonNullable<ActionState> {
  return { ok: false, error, fieldErrors };
}

export function done(message: string): NonNullable<ActionState> {
  return { ok: true, message };
}

/** Validasi FormData dengan zod; mengembalikan data atau ActionState galat. */
export function parseForm<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): { ok: true; data: z.infer<T> } | { ok: false; state: NonNullable<ActionState> } {
  const raw: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const key of new Set(formData.keys())) {
    const all = formData.getAll(key);
    raw[key] = all.length > 1 ? all : all[0];
  }
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  const first = Object.values(fieldErrors)[0] ?? "Data tidak valid.";
  return { ok: false, state: fail(first, fieldErrors) };
}

/** Teks form kosong → undefined / null agar mudah dipakai di zod. */
export const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const requiredText = (label: string, max = 200) =>
  z
    .string({ error: `${label} wajib diisi` })
    .trim()
    .min(1, `${label} wajib diisi`)
    .max(max, `${label} maksimal ${max} karakter`);

/** Nomor telepon Indonesia: 08xx / +62 / 62, 9–14 digit. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?62|0)8[0-9]{7,12}$/, "Nomor WhatsApp tidak valid (contoh: 081234567890)");

export const idrAmount = (label: string) =>
  z.coerce
    .number({ error: `${label} harus berupa angka` })
    .int(`${label} harus bilangan bulat`)
    .min(0, `${label} tidak boleh negatif`);

export function normalizePhone(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+62")) return "0" + digits.slice(3);
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
}
