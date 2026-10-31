/**
 * Pemeriksaan sebelum deploy ke Vercel. Membaca environment, lalu menghubungi database dan memeriksa
 * tabel, migrasi, Super Admin, level agen, dan sisa data demo. Tidak mencetak rahasia apa pun.
 *
 *   npm run deploy:check                                    → memakai .env.local
 *   npm run deploy:check -- --env=.env.production.local     → memakai berkas lain
 *
 * Cara mendapat berkas produksi:  vercel env pull .env.production.local --environment=production
 * Keluar dengan kode 1 bila ada galat (peringatan tidak menggagalkan).
 */
import { existsSync, readFileSync } from "node:fs";
import { eq, like, sql } from "drizzle-orm";

const envArg = process.argv.find((a) => a.startsWith("--env="))?.slice(6) ?? ".env.local";
if (existsSync(envArg)) process.loadEnvFile(envArg);
else console.log(`(berkas ${envArg} tidak ada; memakai environment shell saja)\n`);

type Level = "ok" | "warn" | "fail";
const results: { level: Level; text: string }[] = [];
const add = (level: Level, text: string) => results.push({ level, text });
const env = (k: string) => process.env[k]?.trim() ?? "";
const isLocal = (u: string) => /^(https?:\/\/)?(localhost|127\.0\.0\.1)/i.test(u);

function checkEnv() {
  const db = env("DATABASE_URL");
  if (!db) add("fail", "DATABASE_URL belum diisi.");
  else {
    try {
      const u = new URL(db);
      add("ok", `DATABASE_URL terisi (host ${u.hostname}).`);
      if (!u.hostname.includes("-pooler")) add("warn", "DATABASE_URL bukan endpoint pooled (tanpa -pooler). Di Vercel pakai yang pooled agar koneksi tidak habis.");
      if (!/sslmode=require/.test(u.search)) add("warn", "DATABASE_URL tanpa sslmode=require.");
    } catch {
      add("fail", "DATABASE_URL bukan URL yang valid.");
    }
  }

  const secret = env("BETTER_AUTH_SECRET");
  if (!secret) add("fail", "BETTER_AUTH_SECRET belum diisi.");
  else if (secret.length < 32) add("warn", "BETTER_AUTH_SECRET kurang dari 32 karakter. Buat ulang: openssl rand -base64 32");
  else add("ok", "BETTER_AUTH_SECRET terisi.");

  const app = env("NEXT_PUBLIC_APP_URL");
  if (!app) add("warn", "NEXT_PUBLIC_APP_URL kosong. Di Vercel dipakai domain produksi otomatis, tapi sebaiknya diisi.");
  else if (isLocal(app)) add("warn", `NEXT_PUBLIC_APP_URL masih ${app}. Untuk produksi isi dengan https://domain-kamu. (Diabaikan otomatis di Vercel.)`);
  else if (!app.startsWith("https://")) add("warn", "NEXT_PUBLIC_APP_URL sebaiknya diawali https://.");
  else add("ok", `NEXT_PUBLIC_APP_URL = ${app}`);

  const gId = env("GOOGLE_CLIENT_ID");
  const gSecret = env("GOOGLE_CLIENT_SECRET");
  if (gId && gSecret) add("ok", "Login Google aktif. Pastikan redirect URI https://DOMAIN/api/auth/callback/google sudah ditambahkan di Google Cloud.");
  else if (gId || gSecret) add("warn", "Hanya salah satu dari GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET yang terisi, tombol Google tidak akan muncul.");
  else add("ok", "Login Google tidak dipakai (hanya email dan password).");

  const cloud = ["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].filter((k) => env(k));
  if (cloud.length === 3) add("ok", "Cloudinary terisi.");
  else if (cloud.length === 0) add("warn", "Cloudinary kosong: unggah gambar produk dan bukti transfer tidak berfungsi (gambar lokal di /public tetap bisa dipakai).");
  else add("warn", "Cloudinary terisi sebagian. Ketiga variabelnya harus ada.");

  if (!env("NEXT_PUBLIC_WHATSAPP_NUMBER")) add("warn", "NEXT_PUBLIC_WHATSAPP_NUMBER kosong: tombol WhatsApp di halaman produk dan pesanan tidak tampil.");
}

async function checkDatabase() {
  if (!env("DATABASE_URL")) return;
  const { db, agentLevels, agents, products, user } = await import("@/db");

  try {
    await db.execute(sql`select 1`);
    add("ok", "Database terjangkau.");
  } catch (error) {
    add("fail", `Database tidak terjangkau: ${(error as Error).message}`);
    return;
  }

  const expected = ["user", "session", "account", "verification", "agent_levels", "agents", "categories", "products", "orders", "wallet_entries", "withdrawals"];
  const have = await db.execute<{ table_name: string }>(sql`select table_name from information_schema.tables where table_schema = 'public'`);
  const names = new Set(have.rows.map((r) => r.table_name));
  const missing = expected.filter((t) => !names.has(t));
  if (missing.length) {
    add("fail", `Tabel belum ada: ${missing.join(", ")}. Jalankan: npm run db:migrate`);
    return;
  }
  add("ok", "Semua tabel ada.");

  const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as { entries: unknown[] };
  try {
    const applied = await db.execute<{ n: number }>(sql`select count(*)::int as n from drizzle.__drizzle_migrations`);
    const n = Number(applied.rows[0]?.n ?? 0);
    if (n < journal.entries.length) add("fail", `Baru ${n} dari ${journal.entries.length} migrasi diterapkan. Jalankan: npm run db:migrate`);
    else add("ok", `Semua ${journal.entries.length} migrasi sudah diterapkan.`);
  } catch {
    add("warn", "Tabel riwayat migrasi tidak ditemukan (skema mungkin dibuat dengan db:push). Pastikan skema sama dengan db/schema.ts.");
  }

  const [admins] = await db.select({ n: sql<number>`count(*)::int` }).from(user).where(eq(user.role, "super_admin"));
  if (!admins.n) add("fail", "Belum ada Super Admin. Isi SEED_ADMIN_* lalu jalankan: npm run db:seed");
  else add("ok", `${admins.n} akun Super Admin.`);

  const [lv] = await db.select({ n: sql<number>`count(*)::int` }).from(agentLevels);
  if (!lv.n) add("fail", "Belum ada level agen, pendaftaran agen akan gagal. Jalankan: npm run db:seed");
  else add("ok", `${lv.n} level agen.`);

  const [pr] = await db.select({ n: sql<number>`count(*)::int` }).from(products);
  if (!pr.n) add("warn", "Katalog produk kosong. Tambahkan lewat panel admin, atau jalankan: npm run db:seed");
  else add("ok", `${pr.n} produk.`);

  const [demo] = await db.select({ n: sql<number>`count(*)::int` }).from(user).where(like(user.email, "%@demo.kerjalin.test"));
  if (demo.n) {
    add(
      "fail",
      `${demo.n} akun demo (@demo.kerjalin.test) masih ada. Password mereka tertulis di README, jadi siapa pun bisa masuk. Hapus: npm run db:seed:me:clean (juga membersihkan akun demo dari db:seed:demo). Lebih aman lagi: pakai database produksi yang terpisah.`,
    );
  }

  const [ag] = await db.select({ n: sql<number>`count(*)::int` }).from(agents);
  add("ok", `${ag.n} agen terdaftar.`);
}

async function main() {
  console.log(`Pemeriksaan deploy (${envArg})\n`);
  checkEnv();
  await checkDatabase();

  const icon = { ok: "✓", warn: "!", fail: "✗" } as const;
  for (const r of results) console.log(`${icon[r.level]} ${r.text}`);
  const fails = results.filter((r) => r.level === "fail").length;
  const warns = results.filter((r) => r.level === "warn").length;
  console.log(`\n${fails} galat, ${warns} peringatan.`);
  process.exit(fails ? 1 : 0);
}

main().catch((error) => {
  console.error("Pemeriksaan gagal:", error);
  process.exit(1);
});
