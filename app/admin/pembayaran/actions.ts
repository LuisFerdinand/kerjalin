"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { done, fail, optionalText, parseForm, type ActionState } from "@/lib/action-utils";
import { GATEWAY_KEYS, PAYMENT_META, isGatewayKey } from "@/lib/payments/meta";
import { PaymentError, saveGatewaySettings, saveQrisSettings, testGateway } from "@/lib/payments/service";
import { requireAdmin } from "@/lib/session";

function failFrom(error: PaymentError) {
  return fail(error.message, error.field ? { [error.field]: error.message } : undefined);
}

const gatewaySchema = z.object({
  key: z.enum(GATEWAY_KEYS),
  enabled: z.literal("on").optional(),
  mode: z.enum(["sandbox", "production"]).default("sandbox"),
  // Kosong = tetap memakai nilai yang sudah tersimpan.
  serverKey: optionalText(300),
  secretKey: optionalText(300),
  callbackToken: optionalText(300),
});

export async function saveGatewayAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(gatewaySchema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;
  try {
    await saveGatewaySettings({
      key: d.key,
      enabled: Boolean(d.enabled),
      mode: d.mode,
      values: { serverKey: d.serverKey, secretKey: d.secretKey, callbackToken: d.callbackToken },
      userId: admin.id,
    });
  } catch (error) {
    if (error instanceof PaymentError) return failFrom(error);
    throw error;
  }
  revalidatePath("/admin/pembayaran");
  return done(`Pengaturan ${PAYMENT_META[d.key].label} disimpan.`);
}

export async function testGatewayAction(key: string): Promise<ActionState> {
  await requireAdmin();
  if (!isGatewayKey(key)) return fail("Metode tidak dikenal.");
  try {
    const res = await testGateway(key);
    return res.ok ? done(res.message) : fail(res.message);
  } catch (error) {
    console.error("[testGatewayAction]", error);
    return fail("Pengujian gagal. Coba lagi.");
  }
}

const qrisSchema = z.object({
  enabled: z.literal("on").optional(),
  merchantName: optionalText(80),
  instructions: optionalText(400),
});

export async function saveQrisAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(qrisSchema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;
  try {
    await saveQrisSettings({
      enabled: Boolean(d.enabled),
      merchantName: d.merchantName,
      instructions: d.instructions,
      userId: admin.id,
    });
  } catch (error) {
    if (error instanceof PaymentError) return failFrom(error);
    throw error;
  }
  revalidatePath("/admin/pembayaran");
  return done("Pengaturan QRIS disimpan.");
}
