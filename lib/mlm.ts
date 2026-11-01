import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import {
  agentLevels,
  agents,
  orders,
  walletEntries,
  withdrawals,
  products,
  type Agent,
  type AgentLevel,
  type AgentStatus,
  type PaymentMethodKey,
} from "@/db/schema";
import { MIN_WITHDRAWAL } from "@/lib/config";
import { formatIDR } from "@/lib/format";

/** Galat yang aman ditampilkan ke pengguna. */
export class MlmError extends Error {}

/* -------------------------------------------------------------------------- */
/*  Helper murni                                                               */
/* -------------------------------------------------------------------------- */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return out;
}

/** Slot downline langsung yang berlaku untuk agen. null = tanpa batas. */
export function effectiveSlots(
  agent: Pick<Agent, "maxDownlinesOverride">,
  level: Pick<AgentLevel, "maxDownlines">,
): number | null {
  return agent.maxDownlinesOverride ?? level.maxDownlines ?? null;
}

/** Persen komisi penjualan sendiri yang berlaku untuk agen. */
export function effectiveCommission(
  agent: Pick<Agent, "commissionPercentOverride">,
  level: Pick<AgentLevel, "commissionPercent">,
): number {
  return Number(agent.commissionPercentOverride ?? level.commissionPercent);
}

/** ID leluhur dari path, urut dari yang terdekat (parent) ke yang terjauh. */
export function ancestorIds(path: string, selfId: string): string[] {
  return path
    .split("/")
    .filter(Boolean)
    .filter((id) => id !== selfId)
    .reverse();
}

/* -------------------------------------------------------------------------- */
/*  Pendaftaran & penempatan agen                                              */
/* -------------------------------------------------------------------------- */

async function uniqueReferralCode(tx: Tx) {
  for (let i = 0; i < 10; i++) {
    const code = `KJ${randomCode(6)}`;
    const [hit] = await tx
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.referralCode, code))
      .limit(1);
    if (!hit) return code;
  }
  throw new MlmError("Gagal membuat kode referral. Coba lagi.");
}

async function getDefaultLevel(tx: Tx) {
  const [byDefault] = await tx
    .select()
    .from(agentLevels)
    .where(eq(agentLevels.isDefault, true))
    .limit(1);
  if (byDefault) return byDefault;
  const [first] = await tx.select().from(agentLevels).orderBy(asc(agentLevels.rank)).limit(1);
  if (!first) throw new MlmError("Belum ada level agen. Buat level terlebih dahulu di panel admin.");
  return first;
}

/** Mengunci baris parent lalu memastikan masih ada slot downline. */
async function lockParentAndCheckSlots(
  tx: Tx,
  parentId: string,
  opts?: { ignoreSlots?: boolean; notInsidePath?: string },
) {
  const [parent] = await tx
    .select({ agent: agents, level: agentLevels })
    .from(agents)
    .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
    .where(eq(agents.id, parentId))
    .for("update", { of: agents });
  if (!parent) throw new MlmError("Sponsor tidak ditemukan.");
  if (opts?.notInsidePath && parent.agent.path.startsWith(opts.notInsidePath)) {
    throw new MlmError("Tidak bisa memindahkan agen ke dalam jaringannya sendiri.");
  }
  if (parent.agent.status === "suspended") throw new MlmError("Sponsor sedang dinonaktifkan.");

  if (!opts?.ignoreSlots) {
    const slots = effectiveSlots(parent.agent, parent.level);
    if (slots !== null) {
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(agents)
        .where(eq(agents.parentId, parentId));
      if (count >= slots) {
        throw new MlmError(`Slot downline sponsor sudah penuh (${count}/${slots}).`);
      }
    }
  }
  return parent;
}

export type CreateAgentInput = {
  userId: string;
  phone?: string | null;
  city?: string | null;
  /** Kode referral sponsor. Kosong = langsung di bawah admin. */
  sponsorCode?: string | null;
  /** Dipakai admin untuk menentukan sponsor secara langsung. */
  parentId?: string | null;
  /** Dipakai admin untuk menentukan level secara langsung. */
  levelId?: string | null;
  status?: AgentStatus;
  ignoreSlots?: boolean;
};

export async function createAgentProfile(input: CreateAgentInput) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.userId, input.userId))
      .limit(1);
    if (existing) throw new MlmError("Profil agen sudah ada untuk akun ini.");

    let parentId = input.parentId ?? null;
    if (!parentId && input.sponsorCode) {
      const [sponsor] = await tx
        .select({ id: agents.id })
        .from(agents)
        .where(eq(agents.referralCode, input.sponsorCode.trim().toUpperCase()))
        .limit(1);
      if (!sponsor) throw new MlmError("Kode referral tidak ditemukan.");
      parentId = sponsor.id;
    }

    let level: AgentLevel;
    let parentPath = "/";
    let depth = 1;

    if (parentId) {
      const parent = await lockParentAndCheckSlots(tx, parentId, {
        ignoreSlots: input.ignoreSlots,
      });
      parentPath = parent.agent.path;
      depth = parent.agent.depth + 1;
      if (input.levelId) {
        const [chosen] = await tx
          .select()
          .from(agentLevels)
          .where(eq(agentLevels.id, input.levelId))
          .limit(1);
        if (!chosen) throw new MlmError("Level tidak ditemukan.");
        level = chosen;
      } else {
        if (!parent.level.downlineLevelId) {
          throw new MlmError("Level sponsor ini tidak dapat merekrut agen baru.");
        }
        const [childLevel] = await tx
          .select()
          .from(agentLevels)
          .where(eq(agentLevels.id, parent.level.downlineLevelId))
          .limit(1);
        if (!childLevel) throw new MlmError("Level untuk downline belum diatur.");
        level = childLevel;
      }
    } else if (input.levelId) {
      const [chosen] = await tx
        .select()
        .from(agentLevels)
        .where(eq(agentLevels.id, input.levelId))
        .limit(1);
      if (!chosen) throw new MlmError("Level tidak ditemukan.");
      level = chosen;
    } else {
      level = await getDefaultLevel(tx);
    }

    const id = randomUUID();
    const status = input.status ?? "pending";
    const [created] = await tx
      .insert(agents)
      .values({
        id,
        userId: input.userId,
        parentId,
        levelId: level.id,
        path: `${parentPath}${id}/`,
        depth,
        referralCode: await uniqueReferralCode(tx),
        status,
        phone: input.phone ?? null,
        city: input.city ?? null,
        approvedAt: status === "active" ? new Date() : null,
      })
      .returning();
    return created;
  });
}

/* -------------------------------------------------------------------------- */
/*  Memindahkan agen di dalam pohon                                            */
/* -------------------------------------------------------------------------- */

export async function moveAgent(input: {
  agentId: string;
  newParentId: string | null;
  levelId?: string | null;
  ignoreSlots?: boolean;
}) {
  return db.transaction(async (tx) => {
    const [agent] = await tx
      .select()
      .from(agents)
      .where(eq(agents.id, input.agentId))
      .for("update");
    if (!agent) throw new MlmError("Agen tidak ditemukan.");

    const newParentId = input.newParentId;
    if (newParentId === agent.id) throw new MlmError("Agen tidak bisa menjadi sponsor dirinya sendiri.");

    let newPath = `/${agent.id}/`;
    let newDepth = 1;

    if (newParentId !== agent.parentId) {
      if (newParentId) {
        const parent = await lockParentAndCheckSlots(tx, newParentId, {
          ignoreSlots: input.ignoreSlots,
          notInsidePath: agent.path,
        });
        newPath = `${parent.agent.path}${agent.id}/`;
        newDepth = parent.agent.depth + 1;
      }

      await tx
        .update(agents)
        .set({ parentId: newParentId, path: newPath, depth: newDepth })
        .where(eq(agents.id, agent.id));

      // Perbarui seluruh keturunan agar path & depth tetap konsisten.
      const oldPath = agent.path;
      const delta = newDepth - agent.depth;
      await tx.execute(sql`
        UPDATE agents
        SET path = ${newPath} || substr(path, ${oldPath.length + 1}),
            depth = depth + ${delta},
            updated_at = now()
        WHERE path LIKE ${oldPath + "%"} AND id <> ${agent.id}
      `);
    }

    if (input.levelId) {
      await tx.update(agents).set({ levelId: input.levelId }).where(eq(agents.id, agent.id));
    }
  });
}

/* -------------------------------------------------------------------------- */
/*  Penjualan & pembagian komisi                                               */
/* -------------------------------------------------------------------------- */

function newOrderCode() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `KJ-${ymd}-${randomCode(4)}`;
}

export async function createOrder(input: {
  productId: string;
  agentId: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  months: number;
  /** Total yang dibayar pelanggan. Default: harga produk × bulan. */
  amount?: number;
  note?: string | null;
  /** Metode bayar yang dipilih pelanggan di checkout. Pembayarannya dimulai di lib/payments. */
  paymentMethod?: PaymentMethodKey | null;
  markPaid: boolean;
}) {
  return db.transaction(async (tx) => {
    const [product] = await tx
      .select()
      .from(products)
      .where(eq(products.id, input.productId))
      .limit(1);
    if (!product) throw new MlmError("Produk tidak ditemukan.");

    if (input.agentId) {
      const [seller] = await tx
        .select({ id: agents.id })
        .from(agents)
        .where(eq(agents.id, input.agentId))
        .limit(1);
      if (!seller) throw new MlmError("Agen penjual tidak ditemukan.");
    }

    const amount = input.amount ?? product.priceMonthly * input.months;
    const [order] = await tx
      .insert(orders)
      .values({
        code: newOrderCode(),
        productId: product.id,
        productName: product.name,
        agentId: input.agentId,
        customerName: input.customerName,
        customerEmail: input.customerEmail ?? null,
        customerPhone: input.customerPhone ?? null,
        months: input.months,
        amount,
        adminAmount: 0,
        note: input.note ?? null,
        paymentMethod: input.paymentMethod ?? null,
      })
      .returning();

    if (input.markPaid) await payOrder(tx, order.id);
    return order;
  });
}

/**
 * Menandai pesanan lunas dan membagikan komisi:
 *  - penjual mendapat komisi sesuai level (atau override per agen),
 *  - upline mendapat bonus tim sesuai `overridePercents` level masing-masing,
 *  - sisanya menjadi bagian admin.
 * Idempoten: pesanan yang sudah lunas tidak diproses ulang.
 */
export async function payOrder(tx: Tx, orderId: string) {
  const [order] = await tx
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .for("update");
  if (!order) throw new MlmError("Pesanan tidak ditemukan.");
  if (order.status === "paid") return order;
  if (order.status !== "pending") {
    throw new MlmError("Hanya pesanan berstatus menunggu yang dapat ditandai lunas.");
  }

  const entries: (typeof walletEntries.$inferInsert)[] = [];
  let remaining = order.amount;

  if (order.agentId) {
    const [seller] = await tx
      .select({ agent: agents, level: agentLevels })
      .from(agents)
      .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
      .where(eq(agents.id, order.agentId))
      .limit(1);

    if (seller) {
      if (seller.agent.status === "active") {
        const pct = effectiveCommission(seller.agent, seller.level);
        const amount = Math.min(Math.floor((order.amount * pct) / 100), remaining);
        if (amount > 0) {
          remaining -= amount;
          entries.push({
            agentId: seller.agent.id,
            type: "commission",
            amount,
            orderId: order.id,
            sourceAgentId: seller.agent.id,
            percent: String(pct),
            description: `Komisi penjualan ${order.productName} (${order.code})`,
          });
        }
      }

      const uplineIds = ancestorIds(seller.agent.path, seller.agent.id);
      if (uplineIds.length > 0) {
        const uplines = await tx
          .select({ agent: agents, level: agentLevels })
          .from(agents)
          .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
          .where(inArray(agents.id, uplineIds));
        const byId = new Map(uplines.map((u) => [u.agent.id, u]));

        uplineIds.forEach((uid, index) => {
          const up = byId.get(uid);
          if (!up || up.agent.status !== "active") return;
          const pct = Number(up.level.overridePercents?.[index] ?? 0);
          if (pct <= 0) return;
          const amount = Math.min(Math.floor((order.amount * pct) / 100), remaining);
          if (amount <= 0) return;
          remaining -= amount;
          entries.push({
            agentId: up.agent.id,
            type: "override",
            amount,
            orderId: order.id,
            sourceAgentId: seller.agent.id,
            depth: index + 1,
            percent: String(pct),
            description: `Bonus tim tingkat ${index + 1} dari ${order.productName} (${order.code})`,
          });
        });
      }
    }
  }

  if (entries.length > 0) await tx.insert(walletEntries).values(entries);

  const [paid] = await tx
    .update(orders)
    .set({ status: "paid", paidAt: new Date(), adminAmount: remaining })
    .where(eq(orders.id, order.id))
    .returning();
  return paid;
}

export async function markOrderPaid(orderId: string) {
  return db.transaction((tx) => payOrder(tx, orderId));
}

export async function cancelOrder(orderId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new MlmError("Pesanan tidak ditemukan.");
    if (order.status !== "pending") throw new MlmError("Hanya pesanan menunggu yang bisa dibatalkan.");
    await tx.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));
  });
}

/** Refund: membalik semua komisi & bonus tim yang sudah dibagikan. */
export async function refundOrder(orderId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new MlmError("Pesanan tidak ditemukan.");
    if (order.status !== "paid") throw new MlmError("Hanya pesanan lunas yang bisa direfund.");

    const given = await tx
      .select()
      .from(walletEntries)
      .where(
        and(
          eq(walletEntries.orderId, orderId),
          inArray(walletEntries.type, ["commission", "override"]),
        ),
      );
    if (given.length > 0) {
      await tx.insert(walletEntries).values(
        given.map((e) => ({
          agentId: e.agentId,
          type: "reversal" as const,
          amount: -e.amount,
          orderId,
          sourceAgentId: e.sourceAgentId,
          depth: e.depth,
          percent: e.percent,
          description: `Pembatalan komisi — refund ${order.code}`,
        })),
      );
    }
    await tx
      .update(orders)
      .set({ status: "refunded", adminAmount: 0 })
      .where(eq(orders.id, orderId));
  });
}

/* -------------------------------------------------------------------------- */
/*  Dompet & penarikan                                                         */
/* -------------------------------------------------------------------------- */

export async function getWalletBalance(agentId: string, tx: Tx | typeof db = db) {
  const [row] = await tx
    .select({ total: sql<number>`coalesce(sum(${walletEntries.amount}), 0)::bigint` })
    .from(walletEntries)
    .where(eq(walletEntries.agentId, agentId));
  return Number(row?.total ?? 0);
}

export async function requestWithdrawal(agentId: string, amount: number) {
  return db.transaction(async (tx) => {
    const [agent] = await tx
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .for("update");
    if (!agent) throw new MlmError("Agen tidak ditemukan.");
    if (agent.status !== "active") throw new MlmError("Akun agen belum aktif.");
    if (!agent.bankName || !agent.bankAccountNumber || !agent.bankAccountName) {
      throw new MlmError("Lengkapi data rekening bank di halaman Profil terlebih dahulu.");
    }
    if (!Number.isInteger(amount) || amount < MIN_WITHDRAWAL) {
      throw new MlmError(`Minimal penarikan ${formatIDR(MIN_WITHDRAWAL)}.`);
    }

    const [pending] = await tx
      .select({ id: withdrawals.id })
      .from(withdrawals)
      .where(and(eq(withdrawals.agentId, agentId), eq(withdrawals.status, "pending")))
      .limit(1);
    if (pending) throw new MlmError("Masih ada permintaan penarikan yang sedang diproses.");

    const balance = await getWalletBalance(agentId, tx);
    if (amount > balance) {
      throw new MlmError(`Saldo tidak cukup. Saldo tersedia ${formatIDR(balance)}.`);
    }

    const [w] = await tx
      .insert(withdrawals)
      .values({
        agentId,
        amount,
        bankName: agent.bankName,
        bankAccountNumber: agent.bankAccountNumber,
        bankAccountName: agent.bankAccountName,
      })
      .returning();

    await tx.insert(walletEntries).values({
      agentId,
      type: "withdrawal",
      amount: -amount,
      withdrawalId: w.id,
      description: "Permintaan penarikan dana",
    });
    return w;
  });
}

export async function processWithdrawal(input: {
  id: string;
  action: "paid" | "rejected";
  adminUserId: string;
  note?: string | null;
  proofUrl?: string | null;
}) {
  return db.transaction(async (tx) => {
    const [w] = await tx
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, input.id))
      .for("update");
    if (!w) throw new MlmError("Permintaan penarikan tidak ditemukan.");
    if (w.status !== "pending") throw new MlmError("Permintaan ini sudah diproses.");

    await tx
      .update(withdrawals)
      .set({
        status: input.action,
        adminNote: input.note ?? null,
        proofUrl: input.action === "paid" ? (input.proofUrl ?? null) : null,
        processedBy: input.adminUserId,
        processedAt: new Date(),
      })
      .where(eq(withdrawals.id, w.id));

    if (input.action === "rejected") {
      await tx.insert(walletEntries).values({
        agentId: w.agentId,
        type: "withdrawal_refund",
        amount: w.amount,
        withdrawalId: w.id,
        description: `Penarikan ditolak${input.note ? `: ${input.note}` : ""}`,
      });
    }
    return w;
  });
}

export async function adjustWallet(input: { agentId: string; amount: number; note: string }) {
  if (!Number.isInteger(input.amount) || input.amount === 0) {
    throw new MlmError("Nominal koreksi harus bilangan bulat dan tidak boleh nol.");
  }
  await db.insert(walletEntries).values({
    agentId: input.agentId,
    type: "adjustment",
    amount: input.amount,
    description: input.note,
  });
}
