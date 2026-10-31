/**
 * Mengisi akun agen dengan data contoh agar dashboard bisa dicoba: tim downline, pesanan enam bulan
 * terakhir, komisi, bonus tim, dan penarikan.
 *
 *   npm run db:seed:me                      → untuk luissambas@gmail.com
 *   npm run db:seed:me -- --email=a@b.com   → untuk akun agen lain
 *   npm run db:seed:me:clean                → menghapus data contoh itu
 *
 * Semua data contoh ditandai (pesanan: catatan "demo", akun tim: @demo.kerjalin.test, penarikan dan
 * koreksi: "[demo]") sehingga bisa dihapus tanpa menyentuh data sungguhan.
 */
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq, inArray, like, or } from "drizzle-orm";
import { db } from "@/db";
import { account, agents, orders, products, user, walletEntries, withdrawals } from "@/db/schema";
import {
  adjustWallet,
  createAgentProfile,
  createOrder,
  markOrderPaid,
  processWithdrawal,
  refundOrder,
  cancelOrder,
  requestWithdrawal,
} from "@/lib/mlm";
import { refuseDemoInProduction } from "./guard";
import { seedCatalog } from "./seed-catalog";

const argv = process.argv.slice(2);
const flag = (name: string) => argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const TARGET_EMAIL = (flag("email") ?? "luissambas@gmail.com").toLowerCase();
const DEMO_DOMAIN = "@demo.kerjalin.test";
const DEMO_NOTE = "demo";
const DEMO_TAG = "[demo]";
const DAY = 24 * 60 * 60 * 1000;

/** Pengacak tetap: hasil seed sama setiap dijalankan. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261031);
const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)];

/* -------------------------------------------------------------------------- */

const TEAM = [
  { handle: "andi", name: "Andi Pratama", city: "Bekasi", parent: "me" },
  { handle: "rina", name: "Rina Maharani", city: "Depok", parent: "me" },
  { handle: "dewi", name: "Dewi Lestari", city: "Tangerang", parent: "me" },
  { handle: "bagus", name: "Bagus Setiawan", city: "Bandung", parent: "me" },
  { handle: "rizky", name: "Rizky Ramadhan", city: "Bogor", parent: "andi" },
  { handle: "maya", name: "Maya Putri", city: "Cimahi", parent: "andi" },
  { handle: "nadia", name: "Nadia Safitri", city: "Surabaya", parent: "rina" },
  { handle: "budi", name: "Budi Hartono", city: "Semarang", parent: "dewi" },
] as const;

/** Bobot penjual: akun sendiri paling aktif, tim bawah lebih jarang. */
const SELLER_WEIGHTS: Record<string, number> = {
  me: 15,
  andi: 7,
  rina: 5,
  dewi: 4,
  bagus: 3,
  rizky: 5,
  maya: 3,
  nadia: 2,
  budi: 2,
};

const PRODUCT_WEIGHTS: Record<string, number> = {
  "laundry-saas": 14,
  "kasir-umkm": 8,
  "toko-online-umkm": 5,
  "menu-digital-kafe": 5,
  "booking-jasa": 3,
  "pembukuan-umkm": 3,
  "invoice-tagihan": 2,
  "profil-usaha-online": 2,
};

const CUSTOMERS = [
  ["Laundry Bersih Jaya", "Pak Hendra"],
  ["Cuci Kilat 88", "Bu Tini"],
  ["Fresh Laundry Kemang", "Mas Dimas"],
  ["Laundry Mawar", "Bu Ratna"],
  ["Bubble Laundry", "Mbak Citra"],
  ["Warung Bu Sari", "Bu Sari"],
  ["Toko Berkah Jaya", "Pak Slamet"],
  ["Kopi Senja", "Mas Rendra"],
  ["Warkop Sinar", "Pak Joko"],
  ["Salon Cantik Alya", "Mbak Alya"],
  ["Barbershop Rapi", "Mas Fajar"],
  ["Jahit Mulia", "Bu Wati"],
  ["Depot Makmur", "Pak Anton"],
  ["Toko Kue Lestari", "Bu Lestari"],
  ["Katering Dapur Ibu", "Bu Yuni"],
  ["Bengkel Maju Motor", "Pak Darto"],
] as const;

function weighted(weights: Record<string, number>) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = rand() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[0][0];
}

async function createDemoUser(name: string, handle: string, password: string) {
  const id = randomUUID();
  await db.insert(user).values({ id, name, email: `${handle}${DEMO_DOMAIN}`, emailVerified: true, role: "agent" });
  await db.insert(account).values({
    id: randomUUID(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: await hashPassword(password),
  });
  return id;
}

async function getTarget() {
  const [row] = await db
    .select({ userId: user.id, name: user.name, agentId: agents.id, code: agents.referralCode, status: agents.status })
    .from(user)
    .leftJoin(agents, eq(agents.userId, user.id))
    .where(eq(user.email, TARGET_EMAIL))
    .limit(1);
  return row;
}

/* -------------------------------------------------------------------------- */

async function clean() {
  const demoOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.note, DEMO_NOTE));
  const demoWithdrawals = await db.select({ id: withdrawals.id }).from(withdrawals).where(like(withdrawals.adminNote, `${DEMO_TAG}%`));
  const orderIds = demoOrders.map((o) => o.id);
  const withdrawalIds = demoWithdrawals.map((w) => w.id);

  const conds = [like(walletEntries.description, `${DEMO_TAG}%`)];
  if (orderIds.length) conds.push(inArray(walletEntries.orderId, orderIds));
  if (withdrawalIds.length) conds.push(inArray(walletEntries.withdrawalId, withdrawalIds));
  await db.delete(walletEntries).where(or(...conds));
  if (withdrawalIds.length) await db.delete(withdrawals).where(inArray(withdrawals.id, withdrawalIds));
  if (orderIds.length) await db.delete(orders).where(inArray(orders.id, orderIds));

  const team = await db
    .select({ id: agents.id, depth: agents.depth })
    .from(agents)
    .innerJoin(user, eq(agents.userId, user.id))
    .where(like(user.email, `%${DEMO_DOMAIN}`));
  for (const a of team) {
    await db.delete(orders).where(eq(orders.agentId, a.id));
    await db.delete(walletEntries).where(eq(walletEntries.agentId, a.id));
  }
  for (const a of [...team].sort((x, y) => y.depth - x.depth)) await db.delete(agents).where(eq(agents.id, a.id));
  await db.delete(user).where(like(user.email, `%${DEMO_DOMAIN}`));
  console.log(`✓ Data contoh dihapus: ${orderIds.length} pesanan, ${withdrawalIds.length} penarikan, ${team.length} agen tim.`);
}

/* -------------------------------------------------------------------------- */

async function seed() {
  await seedCatalog();

  const target = await getTarget();
  if (!target) throw new Error(`Akun ${TARGET_EMAIL} tidak ditemukan. Daftar atau masuk dulu lewat situs.`);
  if (!target.agentId) throw new Error(`${TARGET_EMAIL} belum punya profil agen. Lengkapi profil lewat situs dulu.`);
  const me = { id: target.agentId, code: target.code! };

  const [already] = await db.select({ id: orders.id }).from(orders).where(eq(orders.note, DEMO_NOTE)).limit(1);
  if (already) {
    console.log("• Data contoh sudah ada. Jalankan `npm run db:seed:me:clean` dulu bila ingin membuat ulang.");
    return;
  }

  // Profil dan rekening, supaya penarikan bisa diajukan.
  await db
    .update(agents)
    .set({
      status: "active",
      phone: "081234567890",
      city: "Jakarta",
      bankName: "BCA",
      bankAccountNumber: "1234567890",
      bankAccountName: target.name,
      approvedAt: new Date(Date.now() - 200 * DAY),
    })
    .where(eq(agents.id, me.id));

  // Tim downline.
  const pw = "DemoKerjalin123";
  const byHandle = new Map<string, { id: string; code: string }>([["me", me]]);
  for (const t of TEAM) {
    const sponsor = byHandle.get(t.parent)!;
    const userId = await createDemoUser(t.name, t.handle, pw);
    const created = await createAgentProfile({
      userId,
      sponsorCode: sponsor.code,
      phone: "0812" + Math.floor(10000000 + rand() * 89999999),
      city: t.city,
      status: "active",
    });
    byHandle.set(t.handle, { id: created.id, code: created.referralCode });
    // Tanggal gabung tersebar supaya grafik tim terlihat tumbuh.
    const joined = new Date(Date.now() - Math.floor(60 + rand() * 120) * DAY);
    await db.update(agents).set({ createdAt: joined, approvedAt: joined }).where(eq(agents.id, created.id));
    await db.update(user).set({ createdAt: joined }).where(eq(user.id, userId));
  }
  // Satu pendaftar menunggu persetujuan.
  const pendingUser = await createDemoUser("Agus Salim", "agus", pw);
  await createAgentProfile({ userId: pendingUser, sponsorCode: byHandle.get("rina")!.code, city: "Malang" });

  // Pesanan.
  const catalog = await db.select().from(products);
  const bySlug = new Map(catalog.map((p) => [p.slug, p]));
  const COUNT = 42;
  const created: { id: string; status: "paid" | "pending" | "cancelled" | "refunded"; when: Date }[] = [];

  for (let i = 0; i < COUNT; i++) {
    const sellerKey = weighted(SELLER_WEIGHTS);
    const product = bySlug.get(weighted(PRODUCT_WEIGHTS));
    if (!product) continue;
    const plans = product.pricingPlans.length ? product.pricingPlans : [{ months: 1, price: product.priceMonthly }];
    const plan = pick(plans.length > 1 && rand() < 0.45 ? plans : plans.slice(0, 1));
    const [biz, person] = CUSTOMERS[i % CUSTOMERS.length];

    // Lebih banyak pesanan di bulan-bulan terakhir.
    const daysAgo = Math.floor(180 * Math.pow(rand(), 1.7));
    const when = new Date(Date.now() - daysAgo * DAY - Math.floor(rand() * 10) * 60 * 60 * 1000);

    const roll = rand();
    const status: "paid" | "pending" | "cancelled" | "refunded" =
      daysAgo <= 3 && roll < 0.35 ? "pending" : roll > 0.96 ? "refunded" : roll > 0.92 ? "cancelled" : "paid";

    const order = await createOrder({
      productId: product.id,
      agentId: byHandle.get(sellerKey)!.id,
      customerName: `${biz} (${person})`,
      customerEmail: i % 3 === 0 ? `${biz.toLowerCase().replace(/[^a-z]+/g, ".")}@contoh.id` : null,
      customerPhone: "0813" + Math.floor(10000000 + rand() * 89999999),
      months: plan.months,
      amount: plan.price,
      note: DEMO_NOTE,
      markPaid: false,
    });

    if (status === "paid" || status === "refunded") await markOrderPaid(order.id);
    if (status === "refunded") await refundOrder(order.id);
    if (status === "cancelled") await cancelOrder(order.id);

    // Mundurkan tanggal pesanan, pembayaran, dan komisinya.
    const paidAt = new Date(when.getTime() + 2 * 60 * 60 * 1000);
    await db
      .update(orders)
      .set({ createdAt: when, paidAt: status === "paid" || status === "refunded" ? paidAt : null })
      .where(eq(orders.id, order.id));
    await db.update(walletEntries).set({ createdAt: paidAt }).where(and(eq(walletEntries.orderId, order.id), inArray(walletEntries.type, ["commission", "override"])));
    await db
      .update(walletEntries)
      .set({ createdAt: new Date(Math.min(Date.now(), paidAt.getTime() + 2 * DAY)) })
      .where(and(eq(walletEntries.orderId, order.id), eq(walletEntries.type, "reversal")));
    created.push({ id: order.id, status, when });
  }

  // Koreksi dari admin.
  await adjustWallet({ agentId: me.id, amount: 100_000, note: `${DEMO_TAG} Bonus kampanye Oktober` });
  await db.update(walletEntries).set({ createdAt: new Date(Date.now() - 9 * DAY) }).where(like(walletEntries.description, `${DEMO_TAG}%`));

  // Penarikan: satu dibayar, satu ditolak, satu menunggu.
  const [admin] = await db.select({ id: user.id }).from(user).where(eq(user.role, "super_admin")).limit(1);
  const plan: { amount: number; action: "paid" | "rejected" | "pending"; daysAgo: number; note?: string }[] = [
    { amount: 750_000, action: "paid", daysAgo: 48 },
    { amount: 200_000, action: "rejected", daysAgo: 27, note: "Nama rekening tidak sesuai, silakan periksa profil." },
    { amount: 500_000, action: "pending", daysAgo: 2 },
  ];
  for (const w of plan) {
    const req = await requestWithdrawal(me.id, w.amount);
    const requestedAt = new Date(Date.now() - w.daysAgo * DAY);
    const processedAt = new Date(requestedAt.getTime() + 20 * 60 * 60 * 1000);
    if (w.action !== "pending" && admin) {
      await processWithdrawal({ id: req.id, action: w.action, adminUserId: admin.id, note: `${DEMO_TAG} ${w.note ?? "Sudah ditransfer"}` });
    } else {
      await db.update(withdrawals).set({ adminNote: DEMO_TAG }).where(eq(withdrawals.id, req.id));
    }
    await db
      .update(withdrawals)
      .set({ createdAt: requestedAt, ...(w.action !== "pending" ? { processedAt } : {}) })
      .where(eq(withdrawals.id, req.id));
    await db.update(walletEntries).set({ createdAt: requestedAt }).where(and(eq(walletEntries.withdrawalId, req.id), eq(walletEntries.type, "withdrawal")));
    await db.update(walletEntries).set({ createdAt: processedAt }).where(and(eq(walletEntries.withdrawalId, req.id), eq(walletEntries.type, "withdrawal_refund")));
  }

  const paid = created.filter((c) => c.status === "paid").length;
  console.log(`✓ ${TARGET_EMAIL}: ${TEAM.length} agen tim (+1 menunggu), ${created.length} pesanan (${paid} lunas), 3 penarikan.`);
  console.log(`  Kode referral: ${me.code}. Password akun tim contoh: ${pw} (mis. andi${DEMO_DOMAIN}).`);
}

async function main() {
  if (argv.includes("--clean")) await clean();
  else {
    refuseDemoInProduction(argv.includes("--allow-production"));
    await seed();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed gagal:", err);
    process.exit(1);
  });
