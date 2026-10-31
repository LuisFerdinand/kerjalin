"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { cancelOrder, createOrder, markOrderPaid, MlmError, refundOrder } from "@/lib/mlm";
import { done, fail, optionalText, parseForm, requiredText, type ActionState } from "@/lib/action-utils";

function refresh() {
  revalidatePath("/admin/pesanan");
  revalidatePath("/admin/agen");
  revalidatePath("/admin/pohon");
  revalidatePath("/admin");
  revalidatePath("/dashboard", "layout");
}

const schema = z.object({
  productId: z.string().uuid("Pilih produk"),
  agentId: z
    .string()
    .optional()
    .transform((v) => (v && v !== "root" ? v : null))
    .pipe(z.string().uuid().nullable()),
  customerName: requiredText("Nama pelanggan", 100),
  customerEmail: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().email("Format email tidak valid").optional()),
  customerPhone: optionalText(20),
  months: z.coerce.number().int().min(1, "Minimal 1 bulan").max(36, "Maksimal 36 bulan"),
  amount: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? Number(v) : undefined))
    .pipe(z.number().int("Harus bilangan bulat").min(0).max(1_000_000_000).optional()),
  note: optionalText(200),
  markPaid: z.literal("on").optional(),
});

export async function createOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;
  try {
    await createOrder({
      productId: d.productId,
      agentId: d.agentId,
      customerName: d.customerName,
      customerEmail: d.customerEmail,
      customerPhone: d.customerPhone,
      months: d.months,
      amount: d.amount,
      note: d.note,
      markPaid: Boolean(d.markPaid),
    });
  } catch (error) {
    if (error instanceof MlmError) return fail(error.message);
    throw error;
  }
  refresh();
  return done(d.markPaid ? "Penjualan dicatat dan komisi dibagikan." : "Pesanan dicatat (menunggu pembayaran).");
}

const idSchema = z.string().uuid();

async function run(id: string, fn: (id: string) => Promise<unknown>, message: string): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(id).success) return fail("ID tidak valid.");
  try {
    await fn(id);
  } catch (error) {
    if (error instanceof MlmError) return fail(error.message);
    throw error;
  }
  refresh();
  return done(message);
}

export async function markOrderPaidAction(id: string) {
  return run(id, markOrderPaid, "Pesanan lunas. Komisi sudah dibagikan ke agen.");
}

export async function cancelOrderAction(id: string) {
  return run(id, cancelOrder, "Pesanan dibatalkan.");
}

export async function refundOrderAction(id: string) {
  return run(id, refundOrder, "Pesanan direfund. Komisi agen dibatalkan.");
}
