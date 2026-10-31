"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { agents, user } from "@/db/schema";
import { requireAgent } from "@/lib/session";
import { MlmError, requestWithdrawal } from "@/lib/mlm";
import {
  done,
  fail,
  idrAmount,
  normalizePhone,
  optionalText,
  parseForm,
  phoneSchema,
  requiredText,
  type ActionState,
} from "@/lib/action-utils";

const withdrawSchema = z.object({
  amount: idrAmount("Jumlah penarikan").refine((v) => v > 0, "Jumlah penarikan wajib diisi"),
});

export async function requestWithdrawalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { agent } = await requireAgent();
  const parsed = parseForm(withdrawSchema, formData);
  if (!parsed.ok) return parsed.state;

  try {
    await requestWithdrawal(agent.id, parsed.data.amount);
  } catch (error) {
    if (error instanceof MlmError) return fail(error.message, { amount: error.message });
    throw error;
  }
  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin/penarikan");
  revalidatePath("/admin");
  return done("Permintaan penarikan dikirim. Tim Kerjalin akan memprosesnya.");
}

const profileSchema = z.object({
  name: requiredText("Nama", 80).refine((v) => v.length >= 2, "Nama minimal 2 karakter"),
  phone: phoneSchema,
  city: optionalText(60),
  bankName: requiredText("Nama bank / e-wallet", 40),
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{5,25}$/, "Nomor rekening hanya angka (5–25 digit)"),
  bankAccountName: requiredText("Nama pemilik rekening", 80),
});

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { agent, user: current } = await requireAgent();
  const parsed = parseForm(profileSchema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;

  await db.transaction(async (tx) => {
    await tx.update(user).set({ name: d.name }).where(eq(user.id, current.id));
    await tx
      .update(agents)
      .set({
        phone: normalizePhone(d.phone),
        city: d.city ?? null,
        bankName: d.bankName,
        bankAccountNumber: d.bankAccountNumber,
        bankAccountName: d.bankAccountName.toUpperCase(),
      })
      .where(eq(agents.id, agent.id));
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/admin/agen/${agent.id}`);
  return done("Profil dan rekening disimpan.");
}
