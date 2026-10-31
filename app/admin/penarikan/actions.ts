"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { MlmError, processWithdrawal } from "@/lib/mlm";
import { done, fail, optionalText, parseForm, type ActionState } from "@/lib/action-utils";

const schema = z
  .object({
    id: z.string().uuid(),
    action: z.enum(["paid", "rejected"]),
    note: optionalText(300),
    proofUrl: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine(
        (v) => v === undefined || v.startsWith("/") || v.startsWith("https://res.cloudinary.com/"),
        "Gunakan bukti transfer dari Cloudinary (unggah di atas)",
      ),
  })
  .refine((v) => v.action !== "rejected" || Boolean(v.note), {
    path: ["note"],
    message: "Alasan penolakan wajib diisi",
  });

export async function processWithdrawalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;

  try {
    await processWithdrawal({
      id: d.id,
      action: d.action,
      adminUserId: admin.id,
      note: d.note,
      proofUrl: d.proofUrl,
    });
  } catch (error) {
    if (error instanceof MlmError) return fail(error.message);
    throw error;
  }

  revalidatePath("/admin/penarikan");
  revalidatePath("/admin");
  revalidatePath("/admin/agen");
  revalidatePath("/dashboard", "layout");
  return done(d.action === "paid" ? "Penarikan ditandai sudah dibayar." : "Penarikan ditolak dan saldo dikembalikan.");
}
