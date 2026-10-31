"use server";

import { revalidatePath, updateTag } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { agentLevels, agents } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { done, fail, optionalText, parseForm, requiredText, type ActionState } from "@/lib/action-utils";

function refresh() {
  updateTag("levels");
  revalidatePath("/admin/level");
  revalidatePath("/admin/pohon");
  revalidatePath("/admin/agen");
  revalidatePath("/admin");
}

const percent = (label: string) =>
  z.coerce
    .number({ error: `${label} harus berupa angka` })
    .min(0, `${label} minimal 0%`)
    .max(100, `${label} maksimal 100%`);

const schema = z.object({
  id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  name: requiredText("Nama level", 50),
  rank: z.coerce.number().int("Urutan harus bilangan bulat").min(1, "Urutan minimal 1").max(99),
  description: optionalText(200),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna tidak valid"),
  commissionPercent: percent("Komisi"),
  overridePercents: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v?.trim()) return [] as number[];
      const parts = v.split(/[,;\s]+/).filter(Boolean);
      const nums = parts.map((p) => Number(p.replace(",", ".")));
      if (nums.some((n) => !Number.isFinite(n) || n < 0 || n > 100)) {
        ctx.addIssue({ code: "custom", message: "Isi persen 0–100 dipisah koma, mis. 10, 5" });
        return z.NEVER;
      }
      if (nums.length > 5) {
        ctx.addIssue({ code: "custom", message: "Maksimal 5 tingkat bonus tim" });
        return z.NEVER;
      }
      return nums;
    }),
  maxDownlines: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? Number(v) : null))
    .pipe(z.number().int("Harus bilangan bulat").min(0, "Minimal 0").max(100000).nullable()),
  downlineLevelId: z
    .string()
    .optional()
    .transform((v) => (v && v !== "none" ? v : null))
    .pipe(z.string().uuid().nullable()),
  isDefault: z.literal("on").optional(),
});

export async function saveLevelAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;

  const total = d.commissionPercent + d.overridePercents.reduce((a: number, b: number) => a + b, 0);
  if (total > 100) {
    return fail("Total komisi + bonus tim tidak boleh melebihi 100%.", {
      commissionPercent: "Total komisi + bonus tim melebihi 100%",
    });
  }

  const values = {
    name: d.name,
    rank: d.rank,
    description: d.description ?? null,
    color: d.color.toUpperCase(),
    commissionPercent: String(d.commissionPercent),
    overridePercents: d.overridePercents,
    maxDownlines: d.maxDownlines,
    downlineLevelId: d.downlineLevelId,
    isDefault: Boolean(d.isDefault),
  };

  await db.transaction(async (tx) => {
    if (values.isDefault) {
      await tx.update(agentLevels).set({ isDefault: false });
    }
    if (d.id) {
      await tx.update(agentLevels).set(values).where(eq(agentLevels.id, d.id));
    } else {
      await tx.insert(agentLevels).values(values);
    }
  });

  refresh();
  return done(d.id ? "Level diperbarui." : "Level dibuat.");
}

export async function deleteLevelAction(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return fail("ID tidak valid.");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(agents)
    .where(eq(agents.levelId, id));
  if (count > 0) {
    return fail(`Level ini masih dipakai ${count} agen. Pindahkan agennya ke level lain dulu.`);
  }
  await db.delete(agentLevels).where(eq(agentLevels.id, id));
  refresh();
  return done("Level dihapus.");
}
