"use server";

import { revalidatePath, updateTag } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { done, fail, optionalText, parseForm, requiredText, type ActionState } from "@/lib/action-utils";

function refresh() {
  updateTag("products");
  revalidatePath("/admin/kategori");
  revalidatePath("/admin/produk");
  revalidatePath("/produk");
}

const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

const schema = z.object({
  id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  name: requiredText("Nama kategori", 40),
  slug: optionalText(50),
  description: optionalText(160),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;

  const slug = slugify(d.slug ?? d.name);
  if (!slug) return fail("Slug tidak valid.", { slug: "Slug tidak valid" });

  const clash = await db
    .select({ id: categories.id })
    .from(categories)
    .where(d.id ? and(eq(categories.slug, slug), ne(categories.id, d.id)) : eq(categories.slug, slug))
    .limit(1);
  if (clash.length) return fail("Slug sudah dipakai kategori lain.", { slug: "Slug sudah dipakai" });

  const values = { name: d.name, slug, description: d.description ?? null, sortOrder: d.sortOrder };
  if (d.id) await db.update(categories).set(values).where(eq(categories.id, d.id));
  else await db.insert(categories).values(values);

  refresh();
  return done(d.id ? "Kategori diperbarui." : "Kategori ditambahkan.");
}

export async function deleteCategoryAction(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return fail("ID tidak valid.");
  // Produk di kategori ini menjadi "tanpa kategori" (FK set null).
  await db.delete(categories).where(eq(categories.id, id));
  refresh();
  return done("Kategori dihapus. Produknya menjadi tanpa kategori.");
}
