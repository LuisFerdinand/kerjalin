"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { createAgentProfile, MlmError } from "@/lib/mlm";
import { lookupSponsor } from "@/lib/queries/public";
import {
  fail,
  normalizePhone,
  optionalText,
  parseForm,
  phoneSchema,
  requiredText,
  type ActionState,
} from "@/lib/action-utils";

const registerSchema = z
  .object({
    name: requiredText("Nama", 80).refine((v) => v.length >= 2, "Nama minimal 2 karakter"),
    email: z.string().trim().toLowerCase().email("Format email tidak valid"),
    phone: phoneSchema,
    city: optionalText(60),
    password: z.string().min(8, "Password minimal 8 karakter").max(72, "Password maksimal 72 karakter"),
    confirmPassword: z.string(),
    referral: optionalText(20),
    terms: z.literal("on", { error: "Kamu perlu menyetujui syarat & ketentuan" }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(registerSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { name, email, phone, city, password, referral } = parsed.data;

  if (referral) {
    const sponsor = await lookupSponsor(referral);
    if (sponsor && !sponsor.ok) return fail(sponsor.error, { referral: sponsor.error });
  }

  let userId: string;
  try {
    const res = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
    userId = res.user.id;
  } catch (error) {
    if (error instanceof APIError) {
      const code = String(error.body?.code ?? "");
      if (code.includes("USER_ALREADY_EXISTS")) {
        return fail("Email ini sudah terdaftar. Silakan masuk.", {
          email: "Email sudah terdaftar",
        });
      }
      return fail(error.body?.message ?? "Pendaftaran gagal. Coba lagi.");
    }
    throw error;
  }

  try {
    await createAgentProfile({
      userId,
      phone: normalizePhone(phone),
      city,
      sponsorCode: referral,
    });
  } catch (error) {
    if (error instanceof MlmError) {
      // Akun sudah dibuat; arahkan ke langkah melengkapi profil.
      redirect(`/daftar/lengkapi?e=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  redirect("/dashboard");
}

const completeSchema = z.object({
  phone: phoneSchema,
  city: optionalText(60),
  referral: optionalText(20),
});

/** Untuk pengguna yang masuk lewat Google tetapi belum punya profil agen. */
export async function completeProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = parseForm(completeSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { phone, city, referral } = parsed.data;

  if (referral) {
    const sponsor = await lookupSponsor(referral);
    if (sponsor && !sponsor.ok) return fail(sponsor.error, { referral: sponsor.error });
  }

  try {
    await createAgentProfile({
      userId: user.id,
      phone: normalizePhone(phone),
      city,
      sponsorCode: referral,
    });
  } catch (error) {
    if (error instanceof MlmError) return fail(error.message);
    throw error;
  }
  redirect("/dashboard");
}
