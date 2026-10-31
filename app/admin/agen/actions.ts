"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/session";
import { adjustWallet, createAgentProfile, MlmError, moveAgent } from "@/lib/mlm";
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

function refresh(agentId?: string) {
  revalidatePath("/admin/agen");
  revalidatePath("/admin/pohon");
  revalidatePath("/admin");
  if (agentId) revalidatePath(`/admin/agen/${agentId}`);
}

const uuidOrEmpty = z
  .string()
  .optional()
  .transform((v) => (v && v !== "root" && v !== "auto" ? v : null))
  .pipe(z.string().uuid("ID tidak valid").nullable());

/* -------------------------------------------------------------------------- */

const createSchema = z.object({
  name: requiredText("Nama", 80),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  phone: phoneSchema,
  city: optionalText(60),
  password: z.string().min(8, "Password minimal 8 karakter").max(72),
  parentId: uuidOrEmpty,
  levelId: uuidOrEmpty,
  status: z.enum(["active", "pending"]),
  ignoreSlots: z.literal("on").optional(),
});

export async function createAgentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(createSchema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;

  const ctx = await auth.$context;
  if (await ctx.internalAdapter.findUserByEmail(d.email)) {
    return fail("Email ini sudah terdaftar.", { email: "Email sudah terdaftar" });
  }

  const hash = await ctx.password.hash(d.password);
  const created = await ctx.internalAdapter.createUser(
    { email: d.email, name: d.name, emailVerified: true, role: "agent" },
    { method: "admin" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: hash,
  });

  try {
    await createAgentProfile({
      userId: created.id,
      phone: normalizePhone(d.phone),
      city: d.city,
      parentId: d.parentId,
      levelId: d.levelId,
      status: d.status,
      ignoreSlots: Boolean(d.ignoreSlots),
    });
  } catch (error) {
    await ctx.internalAdapter.deleteUser(created.id);
    if (error instanceof MlmError) return fail(error.message);
    throw error;
  }

  refresh();
  return done(`Agen ${d.name} berhasil ditambahkan.`);
}

/* -------------------------------------------------------------------------- */

const percent = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? Number(v.replace(",", ".")) : null))
  .pipe(z.number().min(0, "Minimal 0").max(100, "Maksimal 100").nullable());

const slots = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? Number(v) : null))
  .pipe(z.number().int("Harus bilangan bulat").min(0, "Minimal 0").max(100000).nullable());

const updateSchema = z.object({
  id: z.string().uuid(),
  levelId: z.string().uuid("Pilih level"),
  maxDownlinesOverride: slots,
  commissionPercentOverride: percent,
  status: z.enum(["pending", "active", "suspended"]),
  adminNotes: optionalText(500),
});

export async function updateAgentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(updateSchema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;

  const [current] = await db.select().from(agents).where(eq(agents.id, d.id)).limit(1);
  if (!current) return fail("Agen tidak ditemukan.");

  await db
    .update(agents)
    .set({
      levelId: d.levelId,
      maxDownlinesOverride: d.maxDownlinesOverride,
      commissionPercentOverride:
        d.commissionPercentOverride === null ? null : String(d.commissionPercentOverride),
      status: d.status,
      adminNotes: d.adminNotes ?? null,
      approvedAt: d.status === "active" && !current.approvedAt ? new Date() : current.approvedAt,
    })
    .where(eq(agents.id, d.id));

  refresh(d.id);
  return done("Pengaturan agen disimpan.");
}

/* -------------------------------------------------------------------------- */

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "active", "suspended"]),
});

/** Persetujuan / penonaktifan cepat dari daftar & pohon. */
export async function setAgentStatusAction(id: string, status: "pending" | "active" | "suspended") {
  await requireAdmin();
  const parsed = statusSchema.safeParse({ id, status });
  if (!parsed.success) return fail("Data tidak valid.");
  const [current] = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  if (!current) return fail("Agen tidak ditemukan.");
  await db
    .update(agents)
    .set({ status, approvedAt: status === "active" && !current.approvedAt ? new Date() : current.approvedAt })
    .where(eq(agents.id, id));
  refresh(id);
  return done(status === "active" ? "Agen diaktifkan." : status === "suspended" ? "Agen dinonaktifkan." : "Status diperbarui.");
}

/* -------------------------------------------------------------------------- */

const moveSchema = z.object({
  id: z.string().uuid(),
  parentId: uuidOrEmpty,
  levelId: uuidOrEmpty,
  ignoreSlots: z.literal("on").optional(),
});

export async function moveAgentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(moveSchema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;
  try {
    await moveAgent({
      agentId: d.id,
      newParentId: d.parentId,
      levelId: d.levelId,
      ignoreSlots: Boolean(d.ignoreSlots),
    });
  } catch (error) {
    if (error instanceof MlmError) return fail(error.message);
    throw error;
  }
  refresh(d.id);
  return done("Agen berhasil dipindahkan.");
}

/* -------------------------------------------------------------------------- */

const adjustSchema = z.object({
  id: z.string().uuid(),
  direction: z.enum(["add", "subtract"]),
  amount: idrAmount("Nominal").refine((v) => v > 0, "Nominal harus lebih dari 0"),
  note: requiredText("Catatan", 200),
});

export async function adjustWalletAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(adjustSchema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;
  try {
    await adjustWallet({
      agentId: d.id,
      amount: d.direction === "add" ? d.amount : -d.amount,
      note: d.note,
    });
  } catch (error) {
    if (error instanceof MlmError) return fail(error.message);
    throw error;
  }
  refresh(d.id);
  revalidatePath("/admin/penarikan");
  return done("Saldo agen dikoreksi.");
}
