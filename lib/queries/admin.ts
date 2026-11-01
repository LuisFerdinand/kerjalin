import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  agentLevels,
  agents,
  orders,
  user,
  walletEntries,
  withdrawals,
  type AgentStatus,
  type OrderStatus,
  type WithdrawalStatus,
} from "@/db/schema";
import { ancestorIds, effectiveSlots } from "@/lib/mlm";

const num = (v: unknown) => Number(v ?? 0);

/* -------------------------------------------------------------------------- */
/*  Ringkasan                                                                  */
/* -------------------------------------------------------------------------- */

export async function getAdminCounts() {
  const res = await db.execute<{
    pending_agents: number;
    pending_withdrawals: number;
    pending_orders: number;
  }>(sql`
    select
      (select count(*)::int from agents where status = 'pending') as pending_agents,
      (select count(*)::int from withdrawals where status = 'pending') as pending_withdrawals,
      (select count(*)::int from orders where status = 'pending') as pending_orders
  `);
  const row = res.rows[0];
  return {
    pendingAgents: num(row?.pending_agents),
    pendingWithdrawals: num(row?.pending_withdrawals),
    pendingOrders: num(row?.pending_orders),
  };
}

export type DailyPoint = { date: string; gross: number; admin: number; commission: number };

export async function getAdminOverview() {
  const [agentStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`(count(*) filter (where ${agents.status} = 'active'))::int`,
      pending: sql<number>`(count(*) filter (where ${agents.status} = 'pending'))::int`,
      suspended: sql<number>`(count(*) filter (where ${agents.status} = 'suspended'))::int`,
    })
    .from(agents);

  const [orderStats] = await db
    .select({
      paidCount: sql<number>`(count(*) filter (where ${orders.status} = 'paid'))::int`,
      pendingCount: sql<number>`(count(*) filter (where ${orders.status} = 'pending'))::int`,
      gross: sql<number>`coalesce(sum(${orders.amount}) filter (where ${orders.status} = 'paid'), 0)::bigint`,
      adminShare: sql<number>`coalesce(sum(${orders.adminAmount}) filter (where ${orders.status} = 'paid'), 0)::bigint`,
    })
    .from(orders);

  const [walletStats] = await db
    .select({
      earned: sql<number>`coalesce(sum(${walletEntries.amount}) filter (where ${walletEntries.type} in ('commission','override','reversal','adjustment')), 0)::bigint`,
      outstanding: sql<number>`coalesce(sum(${walletEntries.amount}), 0)::bigint`,
    })
    .from(walletEntries);

  const [wdStats] = await db
    .select({
      pendingCount: sql<number>`(count(*) filter (where ${withdrawals.status} = 'pending'))::int`,
      pendingAmount: sql<number>`coalesce(sum(${withdrawals.amount}) filter (where ${withdrawals.status} = 'pending'), 0)::bigint`,
      paidAmount: sql<number>`coalesce(sum(${withdrawals.amount}) filter (where ${withdrawals.status} = 'paid'), 0)::bigint`,
    })
    .from(withdrawals);

  const series = await db.execute<{ date: string; gross: string; admin: string }>(sql`
    select to_char(d, 'YYYY-MM-DD') as date,
           coalesce(sum(o.amount), 0)::bigint as gross,
           coalesce(sum(o.admin_amount), 0)::bigint as admin
    from generate_series(
      (now() at time zone 'Asia/Jakarta')::date - 29,
      (now() at time zone 'Asia/Jakarta')::date,
      interval '1 day'
    ) as d
    left join orders o
      on o.status = 'paid'
     and (o.paid_at at time zone 'UTC' at time zone 'Asia/Jakarta')::date = d::date
    group by d
    order by d
  `);

  const levelDistribution = await db
    .select({
      id: agentLevels.id,
      name: agentLevels.name,
      color: agentLevels.color,
      rank: agentLevels.rank,
      count: sql<number>`count(${agents.id})::int`,
    })
    .from(agentLevels)
    .leftJoin(agents, eq(agents.levelId, agentLevels.id))
    .groupBy(agentLevels.id)
    .orderBy(asc(agentLevels.rank));

  const sellerUser = alias(user, "seller_user");
  const recentOrders = await db
    .select({
      id: orders.id,
      code: orders.code,
      productName: orders.productName,
      customerName: orders.customerName,
      amount: orders.amount,
      status: orders.status,
      createdAt: orders.createdAt,
      sellerName: sellerUser.name,
    })
    .from(orders)
    .leftJoin(agents, eq(orders.agentId, agents.id))
    .leftJoin(sellerUser, eq(agents.userId, sellerUser.id))
    .orderBy(desc(orders.createdAt))
    .limit(6);

  const recentAgents = await db
    .select({
      id: agents.id,
      name: user.name,
      email: user.email,
      image: user.image,
      status: agents.status,
      levelName: agentLevels.name,
      createdAt: agents.createdAt,
    })
    .from(agents)
    .innerJoin(user, eq(agents.userId, user.id))
    .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
    .orderBy(desc(agents.createdAt))
    .limit(6);

  const earnedExpr = sql<number>`coalesce(sum(${walletEntries.amount}) filter (where ${walletEntries.type} in ('commission','override','reversal','adjustment')), 0)::bigint`;
  const topAgents = await db
    .select({
      id: agents.id,
      name: user.name,
      image: user.image,
      levelName: agentLevels.name,
      earned: earnedExpr,
    })
    .from(agents)
    .innerJoin(user, eq(agents.userId, user.id))
    .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
    .leftJoin(walletEntries, eq(walletEntries.agentId, agents.id))
    .groupBy(agents.id, user.id, agentLevels.id)
    .orderBy(desc(earnedExpr))
    .limit(5);

  const daily: DailyPoint[] = series.rows.map((r) => ({
    date: r.date,
    gross: num(r.gross),
    admin: num(r.admin),
    commission: num(r.gross) - num(r.admin),
  }));

  // Pembagian omzet 30 hari: komisi penjualan agen, bonus tim, dan bagian Kerjalin.
  const splitRes = await db.execute<{ orders: number; commission: string; override: string }>(sql`
    select
      (select count(*)::int from orders o
        where o.status = 'paid'
          and (o.paid_at at time zone 'UTC' at time zone 'Asia/Jakarta')::date >= (now() at time zone 'Asia/Jakarta')::date - 29) as orders,
      coalesce((select sum(w.amount) from wallet_entries w join orders o on o.id = w.order_id
        where o.status = 'paid' and w.type = 'commission'
          and (o.paid_at at time zone 'UTC' at time zone 'Asia/Jakarta')::date >= (now() at time zone 'Asia/Jakarta')::date - 29), 0)::bigint as commission,
      coalesce((select sum(w.amount) from wallet_entries w join orders o on o.id = w.order_id
        where o.status = 'paid' and w.type = 'override'
          and (o.paid_at at time zone 'UTC' at time zone 'Asia/Jakarta')::date >= (now() at time zone 'Asia/Jakarta')::date - 29), 0)::bigint as override
  `);
  const gross30 = daily.reduce((s, d) => s + d.gross, 0);
  const admin30 = daily.reduce((s, d) => s + d.admin, 0);
  const period = {
    orders: num(splitRes.rows[0]?.orders),
    gross: gross30,
    admin: admin30,
    commission: num(splitRes.rows[0]?.commission),
    override: num(splitRes.rows[0]?.override),
  };

  return {
    agents: agentStats,
    orders: {
      paidCount: num(orderStats?.paidCount),
      pendingCount: num(orderStats?.pendingCount),
      gross: num(orderStats?.gross),
      adminShare: num(orderStats?.adminShare),
    },
    wallet: { earned: num(walletStats?.earned), outstanding: num(walletStats?.outstanding) },
    withdrawals: {
      pendingCount: num(wdStats?.pendingCount),
      pendingAmount: num(wdStats?.pendingAmount),
      paidAmount: num(wdStats?.paidAmount),
    },
    daily,
    period,
    levelDistribution,
    recentOrders,
    recentAgents,
    topAgents: topAgents.map((t) => ({ ...t, earned: num(t.earned) })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Agen                                                                       */
/* -------------------------------------------------------------------------- */

export type AgentListParams = {
  q?: string;
  status?: AgentStatus;
  levelId?: string;
  page?: number;
  pageSize?: number;
};

export async function listAgents(params: AgentListParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 20;
  const parentAgent = alias(agents, "parent_agent");
  const parentUser = alias(user, "parent_user");

  const filters: (SQL | undefined)[] = [];
  if (params.status) filters.push(eq(agents.status, params.status));
  if (params.levelId) filters.push(eq(agents.levelId, params.levelId));
  if (params.q?.trim()) {
    const like = `%${params.q.trim()}%`;
    filters.push(
      or(
        ilike(user.name, like),
        ilike(user.email, like),
        ilike(agents.referralCode, like),
        ilike(agents.phone, like),
      ),
    );
  }
  const where = and(...filters);

  const rows = await db
    .select({
      id: agents.id,
      name: user.name,
      email: user.email,
      image: user.image,
      phone: agents.phone,
      city: agents.city,
      status: agents.status,
      depth: agents.depth,
      referralCode: agents.referralCode,
      levelId: agentLevels.id,
      levelName: agentLevels.name,
      levelColor: agentLevels.color,
      parentId: agents.parentId,
      parentName: parentUser.name,
      createdAt: agents.createdAt,
      directCount: sql<number>`(select count(*)::int from agents c where c.parent_id = ${agents.id})`,
      balance: sql<number>`coalesce((select sum(w.amount) from wallet_entries w where w.agent_id = ${agents.id}), 0)::bigint`,
    })
    .from(agents)
    .innerJoin(user, eq(agents.userId, user.id))
    .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
    .leftJoin(parentAgent, eq(agents.parentId, parentAgent.id))
    .leftJoin(parentUser, eq(parentAgent.userId, parentUser.id))
    .where(where)
    .orderBy(desc(agents.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(agents)
    .innerJoin(user, eq(agents.userId, user.id))
    .where(where);

  return {
    rows: rows.map((r) => ({ ...r, balance: num(r.balance), directCount: num(r.directCount) })),
    total: num(total),
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(num(total) / pageSize)),
  };
}

export async function getAgentDetail(id: string) {
  const parentAgent = alias(agents, "parent_agent");
  const parentUser = alias(user, "parent_user");

  const [row] = await db
    .select({
      agent: agents,
      user: user,
      level: agentLevels,
      parentName: parentUser.name,
    })
    .from(agents)
    .innerJoin(user, eq(agents.userId, user.id))
    .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
    .leftJoin(parentAgent, eq(agents.parentId, parentAgent.id))
    .leftJoin(parentUser, eq(parentAgent.userId, parentUser.id))
    .where(eq(agents.id, id))
    .limit(1);
  if (!row) return null;

  const children = await db
    .select({
      id: agents.id,
      name: user.name,
      email: user.email,
      status: agents.status,
      levelName: agentLevels.name,
      levelColor: agentLevels.color,
      createdAt: agents.createdAt,
      directCount: sql<number>`(select count(*)::int from agents c where c.parent_id = ${agents.id})`,
    })
    .from(agents)
    .innerJoin(user, eq(agents.userId, user.id))
    .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
    .where(eq(agents.parentId, id))
    .orderBy(asc(agents.createdAt));

  const upIds = ancestorIds(row.agent.path, row.agent.id);
  const ancestors = upIds.length
    ? await db
        .select({ id: agents.id, name: user.name, depth: agents.depth })
        .from(agents)
        .innerJoin(user, eq(agents.userId, user.id))
        .where(inArray(agents.id, upIds))
        .orderBy(asc(agents.depth))
    : [];

  const [downline] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(agents)
    .where(and(sql`${agents.path} like ${row.agent.path + "%"}`, sql`${agents.id} <> ${id}`));

  const wallet = await getWalletSummary(id);

  const entries = await db
    .select()
    .from(walletEntries)
    .where(eq(walletEntries.agentId, id))
    .orderBy(desc(walletEntries.createdAt))
    .limit(25);

  const agentOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.agentId, id))
    .orderBy(desc(orders.createdAt))
    .limit(10);

  const agentWithdrawals = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.agentId, id))
    .orderBy(desc(withdrawals.createdAt))
    .limit(10);

  return {
    ...row,
    slots: effectiveSlots(row.agent, row.level),
    children,
    ancestors,
    downlineTotal: num(downline?.total),
    wallet,
    entries,
    orders: agentOrders,
    withdrawals: agentWithdrawals,
  };
}

export async function getWalletSummary(agentId: string) {
  const [w] = await db
    .select({
      balance: sql<number>`coalesce(sum(${walletEntries.amount}), 0)::bigint`,
      earned: sql<number>`coalesce(sum(${walletEntries.amount}) filter (where ${walletEntries.type} in ('commission','override','reversal','adjustment')), 0)::bigint`,
    })
    .from(walletEntries)
    .where(eq(walletEntries.agentId, agentId));
  const [wd] = await db
    .select({
      pending: sql<number>`coalesce(sum(${withdrawals.amount}) filter (where ${withdrawals.status} = 'pending'), 0)::bigint`,
      paid: sql<number>`coalesce(sum(${withdrawals.amount}) filter (where ${withdrawals.status} = 'paid'), 0)::bigint`,
    })
    .from(withdrawals)
    .where(eq(withdrawals.agentId, agentId));
  return {
    balance: num(w?.balance),
    earned: num(w?.earned),
    pendingWithdrawal: num(wd?.pending),
    paidWithdrawal: num(wd?.paid),
  };
}

/* -------------------------------------------------------------------------- */
/*  Pohon jaringan                                                             */
/* -------------------------------------------------------------------------- */

export type TreeNodeData = {
  id: string;
  parentId: string | null;
  name: string;
  email: string;
  image: string | null;
  levelId: string;
  levelName: string;
  levelColor: string;
  status: AgentStatus;
  depth: number;
  referralCode: string;
  phone: string | null;
  slots: number | null;
  directCount: number;
  earned: number;
  balance: number;
  maxDownlinesOverride: number | null;
  commissionPercentOverride: string | null;
  adminNotes: string | null;
  levelSlots: number | null;
  levelCommission: number;
};

export async function getTreeNodes(): Promise<TreeNodeData[]> {
  const rows = await db
    .select({
      agent: agents,
      name: user.name,
      email: user.email,
      image: user.image,
      level: agentLevels,
    })
    .from(agents)
    .innerJoin(user, eq(agents.userId, user.id))
    .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
    .orderBy(asc(agents.depth), asc(agents.createdAt));

  const sums = await db
    .select({
      agentId: walletEntries.agentId,
      balance: sql<number>`sum(${walletEntries.amount})::bigint`,
      earned: sql<number>`coalesce(sum(${walletEntries.amount}) filter (where ${walletEntries.type} in ('commission','override','reversal','adjustment')), 0)::bigint`,
    })
    .from(walletEntries)
    .groupBy(walletEntries.agentId);
  const byAgent = new Map(sums.map((s) => [s.agentId, s]));

  const counts = new Map<string, number>();
  for (const r of rows) {
    if (r.agent.parentId) counts.set(r.agent.parentId, (counts.get(r.agent.parentId) ?? 0) + 1);
  }

  return rows.map((r) => ({
    id: r.agent.id,
    parentId: r.agent.parentId,
    name: r.name,
    email: r.email,
    image: r.image,
    levelId: r.level.id,
    levelName: r.level.name,
    levelColor: r.level.color,
    status: r.agent.status,
    depth: r.agent.depth,
    referralCode: r.agent.referralCode,
    phone: r.agent.phone,
    slots: effectiveSlots(r.agent, r.level),
    directCount: counts.get(r.agent.id) ?? 0,
    earned: num(byAgent.get(r.agent.id)?.earned),
    balance: num(byAgent.get(r.agent.id)?.balance),
    maxDownlinesOverride: r.agent.maxDownlinesOverride,
    commissionPercentOverride: r.agent.commissionPercentOverride,
    adminNotes: r.agent.adminNotes,
    levelSlots: r.level.maxDownlines,
    levelCommission: Number(r.level.commissionPercent),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Level                                                                      */
/* -------------------------------------------------------------------------- */

export async function listLevels() {
  const rows = await db
    .select({
      level: agentLevels,
      // Tabel ditulis eksplisit: pada query satu-tabel Drizzle tidak menambahkan prefix tabel pada kolom.
      agentCount: sql<number>`(select count(*)::int from agents a where a.level_id = "agent_levels"."id")`,
    })
    .from(agentLevels)
    .orderBy(asc(agentLevels.rank), asc(agentLevels.createdAt));
  const nameById = new Map(rows.map((r) => [r.level.id, r.level.name]));
  return rows.map((r) => ({
    ...r.level,
    agentCount: num(r.agentCount),
    downlineLevelName: r.level.downlineLevelId ? (nameById.get(r.level.downlineLevelId) ?? null) : null,
  }));
}

/** Opsi untuk dropdown (level & agen). */
export async function listLevelOptions() {
  return db
    .select({
      id: agentLevels.id,
      name: agentLevels.name,
      color: agentLevels.color,
      rank: agentLevels.rank,
    })
    .from(agentLevels)
    .orderBy(asc(agentLevels.rank));
}

export async function listAgentOptions() {
  const rows = await db
    .select({
      id: agents.id,
      name: user.name,
      email: user.email,
      depth: agents.depth,
      status: agents.status,
      levelName: agentLevels.name,
      path: agents.path,
    })
    .from(agents)
    .innerJoin(user, eq(agents.userId, user.id))
    .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
    .orderBy(asc(agents.depth), asc(user.name));
  return rows;
}

/* -------------------------------------------------------------------------- */
/*  Produk, pesanan, penarikan                                                 */
/* -------------------------------------------------------------------------- */

export async function listOrders(params: { status?: OrderStatus; q?: string; awaitingVerification?: boolean }) {
  const sellerUser = alias(user, "seller_user");
  const filters: (SQL | undefined)[] = [];
  if (params.status) filters.push(eq(orders.status, params.status));
  if (params.awaitingVerification) filters.push(and(eq(orders.status, "pending"), isNotNull(orders.paymentSubmittedAt)));
  if (params.q?.trim()) {
    const like = `%${params.q.trim()}%`;
    filters.push(
      or(ilike(orders.code, like), ilike(orders.customerName, like), ilike(sellerUser.name, like)),
    );
  }
  return db
    .select({
      order: orders,
      sellerName: sellerUser.name,
      sellerId: agents.id,
      /** Bukti bayar terbaru dari pelanggan (QRIS). Hanya ID-nya; gambarnya diambil lewat /api/payments/proof/[id]. */
      proofId: sql<string | null>`(
        select pf.id from payment_files pf
        where pf.order_id = ${orders.id} and pf.kind = 'proof'
        order by pf.created_at desc limit 1
      )`,
    })
    .from(orders)
    .leftJoin(agents, eq(orders.agentId, agents.id))
    .leftJoin(sellerUser, eq(agents.userId, sellerUser.id))
    .where(and(...filters))
    .orderBy(desc(orders.createdAt))
    .limit(200);
}

export async function listWithdrawals(params: { status?: WithdrawalStatus }) {
  return db
    .select({
      withdrawal: withdrawals,
      agentId: agents.id,
      name: user.name,
      email: user.email,
      phone: agents.phone,
    })
    .from(withdrawals)
    .innerJoin(agents, eq(withdrawals.agentId, agents.id))
    .innerJoin(user, eq(agents.userId, user.id))
    .where(params.status ? eq(withdrawals.status, params.status) : undefined)
    .orderBy(desc(withdrawals.createdAt))
    .limit(200);
}

/** Jumlah agen per status untuk tab di daftar agen. */
export async function getAgentCounts() {
  const [row] = await db
    .select({
      all: sql<number>`count(*)::int`,
      active: sql<number>`(count(*) filter (where ${agents.status} = 'active'))::int`,
      pending: sql<number>`(count(*) filter (where ${agents.status} = 'pending'))::int`,
      suspended: sql<number>`(count(*) filter (where ${agents.status} = 'suspended'))::int`,
    })
    .from(agents);
  return { all: num(row?.all), active: num(row?.active), pending: num(row?.pending), suspended: num(row?.suspended) };
}

/** Jumlah pesanan per status untuk tab di daftar pesanan. */
export async function getOrderCounts() {
  const [row] = await db
    .select({
      all: sql<number>`count(*)::int`,
      pending: sql<number>`(count(*) filter (where ${orders.status} = 'pending'))::int`,
      paid: sql<number>`(count(*) filter (where ${orders.status} = 'paid'))::int`,
      cancelled: sql<number>`(count(*) filter (where ${orders.status} = 'cancelled'))::int`,
      refunded: sql<number>`(count(*) filter (where ${orders.status} = 'refunded'))::int`,
      verify: sql<number>`(count(*) filter (where ${orders.status} = 'pending' and ${orders.paymentSubmittedAt} is not null))::int`,
    })
    .from(orders);
  return {
    all: num(row?.all),
    pending: num(row?.pending),
    paid: num(row?.paid),
    cancelled: num(row?.cancelled),
    refunded: num(row?.refunded),
    verify: num(row?.verify),
  };
}

/** Jumlah penarikan per status. */
export async function getWithdrawalCounts() {
  const [row] = await db
    .select({
      all: sql<number>`count(*)::int`,
      pending: sql<number>`(count(*) filter (where ${withdrawals.status} = 'pending'))::int`,
      paid: sql<number>`(count(*) filter (where ${withdrawals.status} = 'paid'))::int`,
      rejected: sql<number>`(count(*) filter (where ${withdrawals.status} = 'rejected'))::int`,
    })
    .from(withdrawals);
  return { all: num(row?.all), pending: num(row?.pending), paid: num(row?.paid), rejected: num(row?.rejected) };
}
