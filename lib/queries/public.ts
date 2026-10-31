import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { agentLevels, agents, products, user } from "@/db/schema";
import { effectiveSlots } from "@/lib/mlm";

/** Produk yang tampil di situs publik (aktif & segera hadir). */
export async function getPublicProducts() {
  "use cache";
  cacheTag("products");
  try {
    cacheLife("hours");
    return await db
      .select()
      .from(products)
      .where(inArray(products.status, ["active", "coming_soon"]))
      .orderBy(asc(products.sortOrder), asc(products.name));
  } catch (error) {
    // Jangan menyimpan hasil kosong terlalu lama bila database belum siap.
    console.error("[getPublicProducts]", error);
    cacheLife("seconds");
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag("products");
  try {
    cacheLife("hours");
    const [row] = await db
      .select()
      .from(products)
      .where(
        and(eq(products.slug, slug), inArray(products.status, ["active", "coming_soon"])),
      )
      .limit(1);
    return row ?? null;
  } catch (error) {
    console.error("[getProductBySlug]", error);
    cacheLife("seconds");
    return null;
  }
}

/** Level agen untuk ditampilkan di skema komisi publik. */
export async function getPublicLevels() {
  "use cache";
  cacheTag("levels");
  try {
    cacheLife("hours");
    return await db
      .select({
        id: agentLevels.id,
        name: agentLevels.name,
        rank: agentLevels.rank,
        color: agentLevels.color,
        description: agentLevels.description,
        commissionPercent: agentLevels.commissionPercent,
        overridePercents: agentLevels.overridePercents,
      })
      .from(agentLevels)
      .orderBy(asc(agentLevels.rank));
  } catch (error) {
    console.error("[getPublicLevels]", error);
    cacheLife("seconds");
    return [];
  }
}

export type SponsorInfo =
  | { ok: true; name: string; levelName: string; code: string }
  | { ok: false; error: string };

/** Memeriksa kode referral: ada, aktif, dan masih punya slot downline. */
export async function lookupSponsor(code: string | null | undefined): Promise<SponsorInfo | null> {
  const clean = code?.trim().toUpperCase();
  if (!clean) return null;

  const [row] = await db
    .select({ agent: agents, level: agentLevels, name: user.name })
    .from(agents)
    .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
    .innerJoin(user, eq(agents.userId, user.id))
    .where(eq(agents.referralCode, clean))
    .limit(1);

  if (!row) return { ok: false, error: "Kode referral tidak ditemukan." };
  if (row.agent.status === "suspended") {
    return { ok: false, error: "Sponsor ini sedang tidak aktif." };
  }
  if (!row.level.downlineLevelId) {
    return { ok: false, error: "Sponsor ini tidak dapat merekrut agen baru." };
  }

  const slots = effectiveSlots(row.agent, row.level);
  if (slots !== null) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agents)
      .where(eq(agents.parentId, row.agent.id));
    if (count >= slots) {
      return { ok: false, error: "Slot downline sponsor ini sudah penuh." };
    }
  }

  return { ok: true, name: row.name, levelName: row.level.name, code: clean };
}
