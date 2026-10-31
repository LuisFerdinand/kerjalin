import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, gte, ilike, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, orders, products, type Product, type ProductStatus } from "@/db/schema";

export type CatalogProduct = Product & { categoryName: string | null; categorySlug: string | null };

const PUBLIC_STATUSES = ["active", "coming_soon"] as const satisfies readonly ProductStatus[];
const num = (v: unknown) => Number(v ?? 0);

/* -------------------------------------------------------------------------- */
/*  Situs publik                                                               */
/* -------------------------------------------------------------------------- */

export const PRODUCT_SORTS = {
  unggulan: "Unggulan",
  terbaru: "Terbaru",
  termurah: "Harga terendah",
  termahal: "Harga tertinggi",
  nama: "Nama A–Z",
} as const;
export type ProductSort = keyof typeof PRODUCT_SORTS;

export type PublicProductFilters = {
  q?: string;
  /** Slug kategori. */
  category?: string;
  availability?: "active" | "coming_soon";
  min?: number;
  max?: number;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

const publicSelect = {
  product: products,
  categoryName: categories.name,
  categorySlug: categories.slug,
};

function toCatalog(row: { product: Product; categoryName: string | null; categorySlug: string | null }): CatalogProduct {
  return { ...row.product, categoryName: row.categoryName, categorySlug: row.categorySlug };
}

/** Daftar produk untuk katalog publik, dengan pencarian, filter, urutan, dan halaman. */
export async function listPublicProducts(filters: PublicProductFilters) {
  "use cache";
  cacheTag("products");
  const pageSize = filters.pageSize ?? 8;
  const page = Math.max(1, filters.page ?? 1);
  try {
    cacheLife("hours");
    const conds: (SQL | undefined)[] = [inArray(products.status, PUBLIC_STATUSES)];
    const q = filters.q?.trim();
    if (q) {
      const like = `%${q}%`;
      conds.push(or(ilike(products.name, like), ilike(products.tagline, like), ilike(products.description, like)));
    }
    if (filters.category) conds.push(eq(categories.slug, filters.category));
    if (filters.availability) conds.push(eq(products.status, filters.availability));
    if (filters.min !== undefined) conds.push(gte(products.priceMonthly, filters.min));
    if (filters.max !== undefined) conds.push(lte(products.priceMonthly, filters.max));
    const where = and(...conds);

    const order = {
      unggulan: [desc(products.featured), asc(products.sortOrder), asc(products.name)],
      terbaru: [desc(products.createdAt)],
      termurah: [asc(products.priceMonthly), asc(products.name)],
      termahal: [desc(products.priceMonthly), asc(products.name)],
      nama: [asc(products.name)],
    }[filters.sort ?? "unggulan"];

    const rows = await db
      .select(publicSelect)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(...order)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where);

    return {
      items: rows.map(toCatalog),
      total: num(total),
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(num(total) / pageSize)),
    };
  } catch (error) {
    console.error("[listPublicProducts]", error);
    cacheLife("seconds");
    return { items: [] as CatalogProduct[], total: 0, page, pageSize, pageCount: 1 };
  }
}

/** Kategori (dengan jumlah produk), rentang harga, dan jumlah per ketersediaan untuk panel filter. */
export async function getCatalogFacets() {
  "use cache";
  cacheTag("products");
  try {
    cacheLife("hours");
    const cats = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        // Gambar kategori: gambar produk unggulan pertama di dalamnya.
        imageUrl: sql<string | null>`(select p.image_url from products p where p.category_id = ${categories.id} and p.status in ('active','coming_soon') and p.image_url is not null order by p.featured desc, p.sort_order asc limit 1)`,
        count: sql<number>`count(${products.id})::int`,
      })
      .from(categories)
      .leftJoin(products, and(eq(products.categoryId, categories.id), inArray(products.status, PUBLIC_STATUSES)))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    const [stats] = await db
      .select({
        min: sql<number>`coalesce(min(${products.priceMonthly}), 0)::bigint`,
        max: sql<number>`coalesce(max(${products.priceMonthly}), 0)::bigint`,
        active: sql<number>`(count(*) filter (where ${products.status} = 'active'))::int`,
        soon: sql<number>`(count(*) filter (where ${products.status} = 'coming_soon'))::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(products)
      .where(inArray(products.status, PUBLIC_STATUSES));

    return {
      categories: cats.filter((c) => num(c.count) > 0).map((c) => ({ ...c, count: num(c.count) })),
      minPrice: num(stats?.min),
      maxPrice: num(stats?.max),
      active: num(stats?.active),
      comingSoon: num(stats?.soon),
      total: num(stats?.total),
    };
  } catch (error) {
    console.error("[getCatalogFacets]", error);
    cacheLife("seconds");
    return { categories: [], minPrice: 0, maxPrice: 0, active: 0, comingSoon: 0, total: 0 };
  }
}

/** Beberapa produk untuk beranda. */
export async function getPublicProducts(limit = 6) {
  const { items } = await listPublicProducts({ sort: "unggulan", pageSize: limit });
  return items;
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  "use cache";
  cacheTag("products");
  try {
    cacheLife("hours");
    const [row] = await db
      .select(publicSelect)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.slug, slug), inArray(products.status, PUBLIC_STATUSES)))
      .limit(1);
    return row ? toCatalog(row) : null;
  } catch (error) {
    console.error("[getProductBySlug]", error);
    cacheLife("seconds");
    return null;
  }
}

/** Produk lain untuk "Lihat juga": kategori yang sama lebih dulu. */
export async function getRelatedProducts(productId: string, categoryId: string | null, limit = 3) {
  "use cache";
  cacheTag("products");
  try {
    cacheLife("hours");
    const rows = await db
      .select(publicSelect)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(inArray(products.status, PUBLIC_STATUSES), ne(products.id, productId)))
      .orderBy(
        sql`(${products.categoryId} is not distinct from ${categoryId}::uuid) desc`,
        desc(products.featured),
        asc(products.sortOrder),
      )
      .limit(limit);
    return rows.map(toCatalog);
  } catch (error) {
    console.error("[getRelatedProducts]", error);
    cacheLife("seconds");
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*  Panel admin                                                                */
/* -------------------------------------------------------------------------- */

export const ADMIN_PRODUCT_SORTS = {
  urutan: "Urutan tampil",
  terbaru: "Terbaru diubah",
  nama: "Nama A–Z",
  termurah: "Harga terendah",
  termahal: "Harga tertinggi",
  terjual: "Paling banyak terjual",
} as const;
export type AdminProductSort = keyof typeof ADMIN_PRODUCT_SORTS;

export type AdminProductFilters = {
  q?: string;
  status?: ProductStatus;
  categoryId?: string;
  sort?: AdminProductSort;
  page?: number;
  pageSize?: number;
};

export async function listProductsAdmin(filters: AdminProductFilters) {
  const pageSize = filters.pageSize ?? 15;
  const page = Math.max(1, filters.page ?? 1);

  const conds: (SQL | undefined)[] = [];
  if (filters.status) conds.push(eq(products.status, filters.status));
  if (filters.categoryId) conds.push(eq(products.categoryId, filters.categoryId));
  const q = filters.q?.trim();
  if (q) {
    const like = `%${q}%`;
    conds.push(or(ilike(products.name, like), ilike(products.sku, like), ilike(products.slug, like)));
  }
  const where = and(...conds);

  const sold = sql<number>`(select count(*)::int from orders o where o.product_id = ${products.id} and o.status = 'paid')`;
  const revenue = sql<number>`coalesce((select sum(o.amount) from orders o where o.product_id = ${products.id} and o.status = 'paid'), 0)::bigint`;

  const order = {
    urutan: [asc(products.sortOrder), asc(products.name)],
    terbaru: [desc(products.updatedAt)],
    nama: [asc(products.name)],
    termurah: [asc(products.priceMonthly)],
    termahal: [desc(products.priceMonthly)],
    terjual: [desc(sold), asc(products.name)],
  }[filters.sort ?? "urutan"];

  const rows = await db
    .select({ product: products, categoryName: categories.name, sold, revenue })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(...order)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products)
    .where(where);

  return {
    rows: rows.map((r) => ({ ...r.product, categoryName: r.categoryName, sold: num(r.sold), revenue: num(r.revenue) })),
    total: num(total),
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(num(total) / pageSize)),
  };
}

export async function getProductCountsAdmin() {
  const [row] = await db
    .select({
      all: sql<number>`count(*)::int`,
      active: sql<number>`(count(*) filter (where ${products.status} = 'active'))::int`,
      coming_soon: sql<number>`(count(*) filter (where ${products.status} = 'coming_soon'))::int`,
      draft: sql<number>`(count(*) filter (where ${products.status} = 'draft'))::int`,
      archived: sql<number>`(count(*) filter (where ${products.status} = 'archived'))::int`,
    })
    .from(products);
  return {
    all: num(row?.all),
    active: num(row?.active),
    coming_soon: num(row?.coming_soon),
    draft: num(row?.draft),
    archived: num(row?.archived),
  };
}

export async function getProductAdmin(id: string) {
  const [row] = await db
    .select({ product: products, categoryName: categories.name })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);
  if (!row) return null;

  const [stats] = await db
    .select({
      sold: sql<number>`(count(*) filter (where ${orders.status} = 'paid'))::int`,
      pending: sql<number>`(count(*) filter (where ${orders.status} = 'pending'))::int`,
      revenue: sql<number>`coalesce(sum(${orders.amount}) filter (where ${orders.status} = 'paid'), 0)::bigint`,
      lastOrderAt: sql<Date | null>`max(${orders.createdAt})`,
    })
    .from(orders)
    .where(eq(orders.productId, id));

  const recentOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.productId, id))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  return {
    product: row.product,
    categoryName: row.categoryName,
    stats: {
      sold: num(stats?.sold),
      pending: num(stats?.pending),
      revenue: num(stats?.revenue),
      lastOrderAt: stats?.lastOrderAt ? new Date(stats.lastOrderAt) : null,
    },
    recentOrders,
  };
}

export async function listCategoriesAdmin() {
  const rows = await db
    .select({
      category: categories,
      // Tabel ditulis eksplisit: query satu-tabel di Drizzle tidak memberi prefix tabel pada kolom.
      productCount: sql<number>`(select count(*)::int from products p where p.category_id = "categories"."id")`,
      publicCount: sql<number>`(select count(*)::int from products p where p.category_id = "categories"."id" and p.status in ('active','coming_soon'))`,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return rows.map((r) => ({ ...r.category, productCount: num(r.productCount), publicCount: num(r.publicCount) }));
}

export async function listCategoryOptions() {
  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

/** Produk yang boleh dipilih saat mencatat pesanan (aktif dan segera hadir), lengkap dengan paket. */
export async function listSellableProducts() {
  return db
    .select({
      id: products.id,
      name: products.name,
      priceMonthly: products.priceMonthly,
      pricingPlans: products.pricingPlans,
    })
    .from(products)
    .where(inArray(products.status, PUBLIC_STATUSES))
    .orderBy(asc(products.sortOrder), asc(products.name));
}

