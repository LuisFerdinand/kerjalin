/**
 * Seed data awal Kerjalin.
 *
 *   npm run db:seed              → level agen, Super Admin, contoh produk (aman dijalankan berulang)
 *   npm run db:seed:demo         → + jaringan agen & penjualan contoh (untuk mencoba panel admin)
 *   npm run db:seed:demo:clean   → menghapus data demo
 *
 * Opsi tambahan: --reset-admin-password  (setel ulang password Super Admin dari .env.local)
 */
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { eq, like } from "drizzle-orm";
import { db } from "@/db";
import {
  account,
  agentLevels,
  agents,
  orders,
  products,
  user,
  walletEntries,
} from "@/db/schema";
import { createAgentProfile, createOrder, markOrderPaid } from "@/lib/mlm";

const args = new Set(process.argv.slice(2));
const DEMO_DOMAIN = "@demo.kerjalin.test";

/* -------------------------------------------------------------------------- */

async function seedLevels() {
  const existing = await db.select().from(agentLevels);
  if (existing.length > 0) {
    console.log(`• Level agen sudah ada (${existing.length}), dilewati.`);
    return;
  }

  // Dibuat dari level terbawah supaya downlineLevelId bisa diisi.
  const [sub] = await db
    .insert(agentLevels)
    .values({
      name: "Sub-Agen",
      rank: 3,
      color: "#12A06B",
      description: "Agen di bawah Reseller. Fokus menjual langsung ke pelanggan.",
      commissionPercent: "35",
      overridePercents: [],
      maxDownlines: 0,
      downlineLevelId: null,
    })
    .returning();

  const [reseller] = await db
    .insert(agentLevels)
    .values({
      name: "Agen Reseller",
      rank: 2,
      color: "#0B78F0",
      description: "Agen yang boleh merekrut Sub-Agen dan mendapat bonus tim.",
      commissionPercent: "40",
      overridePercents: [10],
      maxDownlines: 5,
      downlineLevelId: sub.id,
    })
    .returning();

  await db.insert(agentLevels).values({
    name: "Agen Utama",
    rank: 1,
    color: "#F5A524",
    description: "Level tertinggi. Komisi terbesar dan bonus dari dua tingkat downline.",
    commissionPercent: "50",
    overridePercents: [10, 5],
    maxDownlines: 10,
    downlineLevelId: reseller.id,
    isDefault: true,
  });

  console.log("✓ Level agen: Agen Utama → Agen Reseller → Sub-Agen");
}

/* -------------------------------------------------------------------------- */

async function seedSuperAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Super Admin";
  if (!email || !password) {
    console.log("• SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD belum diisi, Super Admin dilewati.");
    return;
  }

  const [existing] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (existing) {
    await db.update(user).set({ role: "super_admin", emailVerified: true }).where(eq(user.id, existing.id));
    if (args.has("--reset-admin-password")) {
      const hash = await hashPassword(password);
      const updated = await db
        .update(account)
        .set({ password: hash })
        .where(eq(account.userId, existing.id))
        .returning({ id: account.id, providerId: account.providerId });
      if (!updated.some((a) => a.providerId === "credential")) {
        await db.insert(account).values({
          id: randomUUID(),
          accountId: existing.id,
          providerId: "credential",
          userId: existing.id,
          password: hash,
        });
      }
      console.log(`✓ Password Super Admin (${email}) disetel ulang.`);
    } else {
      console.log(`• Super Admin ${email} sudah ada (peran dipastikan super_admin).`);
    }
    return;
  }

  const id = randomUUID();
  await db.insert(user).values({ id, name, email, emailVerified: true, role: "super_admin" });
  await db.insert(account).values({
    id: randomUUID(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: await hashPassword(password),
  });
  console.log(`✓ Super Admin dibuat: ${email}`);
}

/* -------------------------------------------------------------------------- */

async function seedProducts() {
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length > 0) {
    console.log("• Produk sudah ada, dilewati.");
    return;
  }

  await db.insert(products).values([
    {
      slug: "laundry-saas",
      name: "Laundry SaaS",
      tagline: "Kelola laundry dari order sampai nota, semua dalam satu aplikasi.",
      description:
        "Aplikasi manajemen laundry untuk outlet kiloan maupun satuan: pencatatan order, status cucian, nota & struk, pelacakan pelanggan, laporan harian, hingga pengingat otomatis lewat WhatsApp.",
      category: "Laundry",
      priceMonthly: 100_000,
      imageUrl: "/images/laundry-machines.jpg",
      features: [
        "Order kiloan & satuan",
        "Nota & struk otomatis",
        "Status cucian real-time",
        "Laporan harian & bulanan",
        "Banyak outlet & karyawan",
      ],
      status: "coming_soon",
      sortOrder: 1,
    },
    {
      slug: "kasir-umkm",
      name: "Kasir UMKM",
      tagline: "Mesin kasir digital untuk warung, kafe, dan toko kelontong.",
      description:
        "Aplikasi kasir (POS) sederhana: katalog produk, stok, transaksi tunai & QRIS, laporan penjualan, dan struk digital.",
      category: "Kasir & Toko",
      priceMonthly: 75_000,
      imageUrl: "/images/pos-checkout.jpg",
      features: ["Katalog & stok produk", "Transaksi tunai & QRIS", "Laporan penjualan", "Struk digital"],
      status: "coming_soon",
      sortOrder: 2,
    },
    {
      slug: "toko-online-umkm",
      name: "Toko Online UMKM",
      tagline: "Etalase online sendiri tanpa ribet, siap dibagikan ke WhatsApp.",
      description:
        "Buat toko online dengan katalog, keranjang, dan checkout lewat WhatsApp. Cocok untuk pelaku UMKM yang ingin berjualan lebih luas.",
      category: "Kasir & Toko",
      priceMonthly: 60_000,
      imageUrl: "/images/open-shop.jpg",
      features: ["Katalog produk", "Checkout via WhatsApp", "Domain sendiri", "Statistik pengunjung"],
      status: "coming_soon",
      sortOrder: 3,
    },
  ]);
  console.log("✓ Produk contoh: Laundry SaaS, Kasir UMKM, Toko Online UMKM (status: segera hadir)");
}

/* -------------------------------------------------------------------------- */
/*  Data demo                                                                  */
/* -------------------------------------------------------------------------- */

async function createDemoUser(name: string, handle: string, password: string) {
  const id = randomUUID();
  const email = `${handle}${DEMO_DOMAIN}`;
  await db.insert(user).values({ id, name, email, emailVerified: true, role: "agent" });
  await db.insert(account).values({
    id: randomUUID(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: await hashPassword(password),
  });
  return id;
}

async function seedDemo() {
  const [already] = await db.select({ id: user.id }).from(user).where(like(user.email, `%${DEMO_DOMAIN}`)).limit(1);
  if (already) {
    console.log("• Data demo sudah ada. Jalankan `npm run db:seed:demo:clean` dulu bila ingin membuat ulang.");
    return;
  }

  const levels = await db.select().from(agentLevels);
  if (levels.length === 0) throw new Error("Jalankan seed dasar dulu (level belum ada).");
  const [laundry] = await db.select().from(products).where(eq(products.slug, "laundry-saas")).limit(1);
  if (!laundry) throw new Error("Produk laundry-saas tidak ditemukan.");

  const pw = "DemoKerjalin123";
  const mk = async (name: string, handle: string, sponsorCode?: string, city?: string) => {
    const userId = await createDemoUser(name, handle, pw);
    return createAgentProfile({
      userId,
      sponsorCode,
      phone: "0812" + Math.floor(10000000 + Math.random() * 89999999),
      city,
      status: "active",
    });
  };

  const budi = await mk("Budi Santoso", "budi", undefined, "Jakarta");
  const sari = await mk("Sari Wulandari", "sari", undefined, "Bandung");
  const andi = await mk("Andi Pratama", "andi", budi.referralCode, "Bekasi");
  const rina = await mk("Rina Maharani", "rina", budi.referralCode, "Depok");
  const dewi = await mk("Dewi Lestari", "dewi", andi.referralCode, "Tangerang");
  const rizky = await mk("Rizky Ramadhan", "rizky", andi.referralCode, "Bogor");
  await mk("Maya Putri", "maya", sari.referralCode, "Cimahi");
  const pending = await createDemoUser("Agus Salim", "agus", pw);
  await createAgentProfile({ userId: pending, sponsorCode: rina.referralCode, city: "Surabaya" });

  const customers = [
    ["Laundry Bersih Jaya", "Pak Hendra"],
    ["Cuci Kilat 88", "Bu Tini"],
    ["Fresh Laundry Kemang", "Mas Dimas"],
    ["Laundry Mawar", "Bu Ratna"],
    ["Bubble Laundry", "Mbak Citra"],
  ];
  const sellers = [dewi, rizky, andi, budi, rina, sari];
  for (let i = 0; i < 14; i++) {
    const seller = sellers[i % sellers.length];
    const [biz, person] = customers[i % customers.length];
    const o = await createOrder({
      productId: laundry.id,
      agentId: seller.id,
      customerName: `${biz} (${person})`,
      customerPhone: "0813" + Math.floor(10000000 + Math.random() * 89999999),
      months: [1, 1, 3, 6, 12][i % 5],
      markPaid: false,
    });
    if (i % 7 !== 6) await markOrderPaid(o.id);
  }

  console.log("✓ Data demo: 8 agen (3 level), 14 pesanan. Password semua akun demo: " + pw);
  console.log(`  Contoh login agen: budi${DEMO_DOMAIN}`);
}

async function cleanDemo() {
  const demoUsers = await db.select({ id: user.id }).from(user).where(like(user.email, `%${DEMO_DOMAIN}`));
  if (demoUsers.length === 0) {
    console.log("• Tidak ada data demo.");
    return;
  }
  const demoAgents = await db
    .select({ id: agents.id, depth: agents.depth })
    .from(agents)
    .innerJoin(user, eq(agents.userId, user.id))
    .where(like(user.email, `%${DEMO_DOMAIN}`));

  const agentIds = new Set(demoAgents.map((a) => a.id));
  for (const a of agentIds) {
    await db.delete(orders).where(eq(orders.agentId, a));
    await db.delete(walletEntries).where(eq(walletEntries.agentId, a));
  }
  // Hapus dari kedalaman terbesar agar FK parent tidak terlanggar.
  for (const a of [...demoAgents].sort((x, y) => y.depth - x.depth)) {
    await db.delete(agents).where(eq(agents.id, a.id));
  }
  await db.delete(user).where(like(user.email, `%${DEMO_DOMAIN}`));
  console.log(`✓ Data demo dihapus (${demoUsers.length} akun).`);
}

/* -------------------------------------------------------------------------- */

async function main() {
  if (args.has("--clean-demo")) {
    await cleanDemo();
    return;
  }
  await seedLevels();
  await seedSuperAdmin();
  await seedProducts();
  if (args.has("--demo")) await seedDemo();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed gagal:", err);
    process.exit(1);
  });
