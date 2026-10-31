"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { PRODUCT_STATUSES, products, type PricingPlan } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { done, fail, optionalText, parseForm, requiredText, type ActionState } from "@/lib/action-utils";

function refresh(id?: string) {
  updateTag("products");
  revalidatePath("/admin/produk");
  revalidatePath("/admin/kategori");
  revalidatePath("/produk");
  revalidatePath("/");
  if (id) revalidatePath(`/admin/produk/${id}`);
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
const imageRule = (v: string) => v.startsWith("/") || v.startsWith("https://res.cloudinary.com/");
const imageMessage = "Gunakan gambar dari Cloudinary (unggah lewat form) atau path lokal seperti /images/foto.jpg";

const optionalImage = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || imageRule(v), imageMessage);

/** Kolom JSON dari editor baris: string → nilai, dengan galat yang ramah. */
function jsonField<T extends z.ZodType>(schema: T, label: string) {
  return z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v?.trim()) return [] as unknown[];
      try {
        return JSON.parse(v) as unknown[];
      } catch {
        ctx.addIssue({ code: "custom", message: `${label} tidak valid` });
        return z.NEVER;
      }
    })
    .pipe(z.array(schema));
}

const galleryField = jsonField(z.string().trim().min(1), "Galeri")
  .refine((list) => list.every(imageRule), imageMessage)
  .transform((list) => list.slice(0, 8));

const planField = jsonField(
  z.object({
    months: z.coerce.number().int("Lama langganan harus bilangan bulat").min(1, "Minimal 1 bulan").max(60, "Maksimal 60 bulan"),
    price: z.coerce.number().int("Harga harus bilangan bulat").min(0, "Harga tidak boleh negatif").max(1_000_000_000),
    label: z
      .string()
      .trim()
      .max(30, "Nama paket maksimal 30 karakter")
      .optional()
      .transform((v) => v || undefined),
  }),
  "Paket harga",
).refine((plans) => new Set(plans.map((p) => p.months)).size === plans.length, "Lama langganan tidak boleh sama di dua paket");

const specField = jsonField(
  z.object({
    label: z.string().trim().min(1, "Label spesifikasi wajib diisi").max(40),
    value: z.string().trim().min(1, "Nilai spesifikasi wajib diisi").max(120),
  }),
  "Spesifikasi",
).transform((l) => l.slice(0, 12));

const faqField = jsonField(
  z.object({
    q: z.string().trim().min(1, "Pertanyaan wajib diisi").max(160),
    a: z.string().trim().min(1, "Jawaban wajib diisi").max(800),
  }),
  "FAQ",
).transform((l) => l.slice(0, 10));

const schema = z.object({
  id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  name: requiredText("Nama produk", 80),
  slug: optionalText(60),
  sku: optionalText(40),
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v && v !== "none" ? v : null))
    .pipe(z.string().uuid().nullable()),
  tagline: optionalText(160),
  description: optionalText(4000),
  badge: optionalText(24),
  releaseNote: optionalText(60),
  demoUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.url("Tautan demo harus berupa URL lengkap (https://...)").nullable()),
  status: z.enum(PRODUCT_STATUSES),
  featured: z.literal("on").optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  priceMonthly: z.coerce
    .number({ error: "Harga harus berupa angka" })
    .int("Harga harus bilangan bulat")
    .min(0, "Harga tidak boleh negatif")
    .max(100_000_000),
  pricingPlans: planField,
  imageUrl: optionalImage,
  gallery: galleryField,
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
  specs: specField,
  faqs: faqField,
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
});

export async function saveProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;

  const slug = slugify(d.slug ?? d.name);
  if (!slug) return fail("Slug tidak valid.", { slug: "Slug tidak valid" });

  const slugClash = await db
    .select({ id: products.id })
    .from(products)
    .where(d.id ? and(eq(products.slug, slug), ne(products.id, d.id)) : eq(products.slug, slug))
    .limit(1);
  if (slugClash.length) return fail("Slug sudah dipakai produk lain.", { slug: "Slug sudah dipakai" });

  if (d.sku) {
    const skuClash = await db
      .select({ id: products.id })
      .from(products)
      .where(d.id ? and(eq(products.sku, d.sku), ne(products.id, d.id)) : eq(products.sku, d.sku))
      .limit(1);
    if (skuClash.length) return fail("SKU sudah dipakai produk lain.", { sku: "SKU sudah dipakai" });
  }

  const plans: PricingPlan[] = [...d.pricingPlans].sort((a, b) => a.months - b.months);
  const values = {
    slug,
    sku: d.sku ?? null,
    name: d.name,
    tagline: d.tagline ?? null,
    description: d.description ?? null,
    categoryId: d.categoryId,
    priceMonthly: d.priceMonthly,
    pricingPlans: plans,
    imageUrl: d.imageUrl,
    gallery: d.gallery,
    features: d.features,
    specs: d.specs,
    faqs: d.faqs,
    badge: d.badge ?? null,
    featured: Boolean(d.featured),
    releaseNote: d.releaseNote ?? null,
    demoUrl: d.demoUrl,
    seoTitle: d.seoTitle ?? null,
    seoDescription: d.seoDescription ?? null,
    status: d.status,
    sortOrder: d.sortOrder,
  };

  if (d.id) {
    await db.update(products).set(values).where(eq(products.id, d.id));
    refresh(d.id);
    return done("Produk disimpan.");
  }

  const [created] = await db.insert(products).values(values).returning({ id: products.id });
  refresh(created.id);
  redirect(`/admin/produk/${created.id}?baru=1`);
}

/* -------------------------------------------------------------------------- */

const idSchema = z.string().uuid();

export async function deleteProductAction(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(id).success) return fail("ID tidak valid.");
  await db.delete(products).where(eq(products.id, id));
  refresh();
  return done("Produk dihapus. Riwayat pesanan tetap tersimpan.");
}

export async function setProductStatusAction(
  id: string,
  status: (typeof PRODUCT_STATUSES)[number],
): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(id).success || !PRODUCT_STATUSES.includes(status)) return fail("Data tidak valid.");
  await db.update(products).set({ status }).where(eq(products.id, id));
  refresh(id);
  return done("Status produk diperbarui.");
}

/** Menyalin produk sebagai draf supaya bisa dipakai sebagai dasar produk baru. */
export async function duplicateProductAction(id: string) {
  await requireAdmin();
  if (!idSchema.safeParse(id).success) return;
  const [src] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!src) return;

  let slug = `${src.slug}-salinan`;
  for (let i = 2; (await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1)).length; i++) {
    slug = `${src.slug}-salinan-${i}`;
  }
  const { id: _id, createdAt: _c, updatedAt: _u, sku: _sku, ...rest } = src;
  void _id;
  void _c;
  void _u;
  void _sku;
  const [copy] = await db
    .insert(products)
    .values({ ...rest, slug, name: `${src.name} (salinan)`, sku: null, status: "draft", featured: false })
    .returning({ id: products.id });
  refresh(copy.id);
  redirect(`/admin/produk/${copy.id}?baru=1`);
}

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  op: z.enum(["status", "delete"]),
  status: z.enum(PRODUCT_STATUSES).optional(),
});

export async function bulkProductsAction(input: z.input<typeof bulkSchema>): Promise<ActionState> {
  await requireAdmin();
  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) return fail("Pilih minimal satu produk.");
  const { ids, op, status } = parsed.data;

  if (op === "delete") {
    await db.delete(products).where(inArray(products.id, ids));
    refresh();
    return done(`${ids.length} produk dihapus.`);
  }
  if (!status) return fail("Pilih status tujuan.");
  await db.update(products).set({ status }).where(inArray(products.id, ids));
  refresh();
  return done(`${ids.length} produk diperbarui.`);
}
