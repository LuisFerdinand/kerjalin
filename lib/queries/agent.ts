import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  agentLevels,
  agents,
  categories,
  orders,
  products,
  user,
  walletEntries,
  withdrawals,
  type Agent,
  type AgentLevel,
  type WalletEntryType,
} from "@/db/schema";
import { effectiveCommission, effectiveSlots } from "@/lib/mlm";
import { getWalletSummary } from "@/lib/queries/admin";

const num = (v: unknown) => Number(v ?? 0);

/** Produk dengan penjualan lunas terbanyak oleh agen ini. */
export async function getTopProducts(agentId: string, limit = 4) {
  const rows = await db
    .select({
      name: orders.productName,
      slug: products.slug,
      imageUrl: products.imageUrl,
      sold: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.amount}), 0)::bigint`,
    })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .where(and(eq(orders.agentId, agentId), eq(orders.status, "paid")))
    .groupBy(orders.productName, products.slug, products.imageUrl)
    .orderBy(desc(sql`count(*)`), desc(sql`sum(${orders.amount})`))
    .limit(limit);
  return rows.map((r) => ({ ...r, sold: num(r.sold), revenue: num(r.revenue) }));
}

export async function getAgentOverview(agent: Agent, level: AgentLevel) {
  const wallet = await getWalletSummary(agent.id);

  const [month] = await db
    .select({
      earned: sql<number>`coalesce(sum(${walletEntries.amount}), 0)::bigint`,
    })
    .from(walletEntries)
    .where(
      and(
        eq(walletEntries.agentId, agent.id),
        inArray(walletEntries.type, ["commission", "override", "reversal", "adjustment"]),
        sql`date_trunc('month', ${walletEntries.createdAt} at time zone 'UTC' at time zone 'Asia/Jakarta') = date_trunc('month', now() at time zone 'Asia/Jakarta')`,
      ),
    );

  const [lastMonth] = await db
    .select({
      earned: sql<number>`coalesce(sum(${walletEntries.amount}), 0)::bigint`,
    })
    .from(walletEntries)
    .where(
      and(
        eq(walletEntries.agentId, agent.id),
        inArray(walletEntries.type, ["commission", "override", "reversal", "adjustment"]),
        sql`date_trunc('month', ${walletEntries.createdAt} at time zone 'UTC' at time zone 'Asia/Jakarta') = date_trunc('month', now() at time zone 'Asia/Jakarta') - interval '1 month'`,
      ),
    );

  const series = await db.execute<{ date: string; commission: string; bonus: string }>(sql`
    select to_char(d, 'YYYY-MM-DD') as date,
           coalesce(sum(w.amount) filter (where w.type in ('commission','reversal','adjustment')), 0)::bigint as commission,
           coalesce(sum(w.amount) filter (where w.type = 'override'), 0)::bigint as bonus
    from generate_series(
      (now() at time zone 'Asia/Jakarta')::date - 29,
      (now() at time zone 'Asia/Jakarta')::date,
      interval '1 day'
    ) as d
    left join wallet_entries w
      on w.agent_id = ${agent.id}
     and w.type in ('commission','override','reversal','adjustment')
     and (w.created_at at time zone 'UTC' at time zone 'Asia/Jakarta')::date = d::date
    group by d
    order by d
  `);

  const [team] = await db
    .select({
      direct: sql<number>`(count(*) filter (where ${agents.parentId} = ${agent.id}))::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(agents)
    .where(and(sql`${agents.path} like ${agent.path + "%"}`, sql`${agents.id} <> ${agent.id}`));

  const [sales] = await db
    .select({
      paid: sql<number>`(count(*) filter (where ${orders.status} = 'paid'))::int`,
      pending: sql<number>`(count(*) filter (where ${orders.status} = 'pending'))::int`,
      revenue: sql<number>`coalesce(sum(${orders.amount}) filter (where ${orders.status} = 'paid'), 0)::bigint`,
    })
    .from(orders)
    .where(eq(orders.agentId, agent.id));

  const recent = await db
    .select()
    .from(walletEntries)
    .where(eq(walletEntries.agentId, agent.id))
    .orderBy(desc(walletEntries.createdAt))
    .limit(6);

  return {
    wallet,
    monthEarned: num(month?.earned),
    lastMonthEarned: num(lastMonth?.earned),
    daily: series.rows.map((r) => ({
      date: r.date,
      commission: num(r.commission),
      bonus: num(r.bonus),
    })),
    team: { direct: num(team?.direct), total: num(team?.total) },
    slots: effectiveSlots(agent, level),
    commissionPercent: effectiveCommission(agent, level),
    sales: {
      paid: num(sales?.paid),
      pending: num(sales?.pending),
      revenue: num(sales?.revenue),
    },
    recent,
  };
}

export type TeamMember = {
  id: string;
  parentId: string | null;
  name: string;
  email: string;
  image: string | null;
  levelName: string;
  levelColor: string;
  status: Agent["status"];
  joinedAt: Date;
  relDepth: number;
  directCount: number;
  salesCount: number;
  bonusEarned: number;
};

/** Seluruh downline (semua tingkat). parentId = null berarti anak langsung agen ini. */
export async function getTeam(agent: Agent): Promise<TeamMember[]> {
  const rows = await db
    .select({
      agent: agents,
      name: user.name,
      email: user.email,
      image: user.image,
      levelName: agentLevels.name,
      levelColor: agentLevels.color,
      salesCount: sql<number>`(select count(*)::int from orders o where o.agent_id = ${agents.id} and o.status = 'paid')`,
      bonusEarned: sql<number>`coalesce((select sum(w.amount) from wallet_entries w where w.agent_id = ${agent.id} and w.source_agent_id = ${agents.id} and w.type in ('override','reversal') ), 0)::bigint`,
    })
    .from(agents)
    .innerJoin(user, eq(agents.userId, user.id))
    .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
    .where(and(sql`${agents.path} like ${agent.path + "%"}`, sql`${agents.id} <> ${agent.id}`))
    .orderBy(asc(agents.depth), asc(agents.createdAt));

  const counts = new Map<string, number>();
  for (const r of rows) {
    if (r.agent.parentId) counts.set(r.agent.parentId, (counts.get(r.agent.parentId) ?? 0) + 1);
  }

  return rows.map((r) => ({
    id: r.agent.id,
    parentId: r.agent.parentId === agent.id ? null : r.agent.parentId,
    name: r.name,
    email: r.email,
    image: r.image,
    levelName: r.levelName,
    levelColor: r.levelColor,
    status: r.agent.status,
    joinedAt: r.agent.createdAt,
    relDepth: r.agent.depth - agent.depth,
    directCount: counts.get(r.agent.id) ?? 0,
    salesCount: num(r.salesCount),
    bonusEarned: num(r.bonusEarned),
  }));
}

export async function listWallet(
  agentId: string,
  params: { type?: WalletEntryType; page?: number; pageSize?: number },
) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 20;
  const where = and(
    eq(walletEntries.agentId, agentId),
    params.type ? eq(walletEntries.type, params.type) : undefined,
  );

  const rows = await db
    .select()
    .from(walletEntries)
    .where(where)
    .orderBy(desc(walletEntries.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(walletEntries)
    .where(where);

  return { rows, total: num(total), page, pageCount: Math.max(1, Math.ceil(num(total) / pageSize)) };
}

export async function listAgentOrders(agentId: string) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.agentId, agentId))
    .orderBy(desc(orders.createdAt))
    .limit(100);
}

export async function listAgentWithdrawals(agentId: string) {
  return db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.agentId, agentId))
    .orderBy(desc(withdrawals.createdAt))
    .limit(100);
}

export async function getAgentCatalog(agent: Agent, level: AgentLevel) {
  const list = await db
    .select({ product: products, categoryName: categories.name })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(inArray(products.status, ["active", "coming_soon"]))
    .orderBy(desc(products.featured), asc(products.sortOrder), asc(products.name));
  const pct = effectiveCommission(agent, level);
  return list.map(({ product: p, categoryName }) => ({
    ...p,
    categoryName,
    commission: Math.floor((p.priceMonthly * pct) / 100),
  }));
}

/** Nama sponsor (upline langsung). null = langsung di bawah Kerjalin. */
export async function getSponsorName(agent: Agent) {
  if (!agent.parentId) return null;
  const [row] = await db
    .select({ name: user.name })
    .from(agents)
    .innerJoin(user, eq(agents.userId, user.id))
    .where(eq(agents.id, agent.parentId))
    .limit(1);
  return row?.name ?? null;
}
