"use server";

import { revalidatePath, updateTag } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { PRODUCT_STATUSES, products } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { done, fail, optionalText, parseForm, requiredText, type ActionState } from "@/lib/action-utils";

function refresh() {
  updateTag("products");
  revalidatePath("/admin/produk");
  revalidatePath("/produk");
  revalidatePath("/");
}

const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** next/image hanya mengizinkan path lokal & Cloudinary. */
const imageUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine(
    (v) => v === null || v.startsWith("/") || v.startsWith("https://res.cloudinary.com/"),
    "Gunakan gambar dari Cloudinary (unggah di atas) atau path lokal seperti /images/foto.jpg",
  );

const schema = z.object({
  id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  name: requiredText("Nama produk", 80),
  slug: optionalText(60),
  category: requiredText("Kategori", 40),
  tagline: optionalText(160),
  description: optionalText(2000),
  priceMonthly: z.coerce
    .number({ error: "Harga harus berupa angka" })
    .int("Harga harus bilangan bulat")
    .min(0, "Harga tidak boleh negatif")
    .max(100_000_000),
  features: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  status: z.enum(PRODUCT_STATUSES),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  imageUrl,
});

export async function saveProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;

  const slug = slugify(d.slug ?? d.name);
  if (!slug) return fail("Slug tidak valid.", { slug: "Slug tidak valid" });

  const clash = await db
    .select({ id: products.id })
    .from(products)
    .where(d.id ? and(eq(products.slug, slug), ne(products.id, d.id)) : eq(products.slug, slug))
    .limit(1);
  if (clash.length) return fail("Slug sudah dipakai produk lain.", { slug: "Slug sudah dipakai" });

  const values = {
    slug,
    name: d.name,
    category: d.category,
    tagline: d.tagline ?? null,
    description: d.description ?? null,
    priceMonthly: d.priceMonthly,
    features: d.features,
    status: d.status,
    sortOrder: d.sortOrder,
    imageUrl: d.imageUrl,
  };

  if (d.id) await db.update(products).set(values).where(eq(products.id, d.id));
  else await db.insert(products).values(values);

  refresh();
  return done(d.id ? "Produk diperbarui." : "Produk ditambahkan.");
}

export async function deleteProductAction(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return fail("ID tidak valid.");
  await db.delete(products).where(eq(products.id, id));
  refresh();
  return done("Produk dihapus. Riwayat pesanan tetap tersimpan.");
}
