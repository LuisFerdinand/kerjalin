/**
 * Nilai konfigurasi yang dibaca dari environment. Semua pemakai ada di sisi server.
 *
 * Alamat situs ditentukan bertahap supaya deploy di Vercel tetap benar walau variabel belum diisi lengkap:
 *  - Preview deployment memakai alamat deployment itu sendiri (VERCEL_URL), jadi login dan tautan tidak
 *    melompat ke domain produksi.
 *  - Produksi memakai NEXT_PUBLIC_APP_URL, lalu BETTER_AUTH_URL, lalu domain produksi dari Vercel.
 *  - Nilai localhost diabaikan saat berjalan di Vercel (biasanya sisa salinan dari .env.local).
 */

const LOCAL_HOST = /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i;

/** "kerjalin.id/" → "https://kerjalin.id". Mengembalikan undefined bila kosong atau bukan URL. */
export function normalizeUrl(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return undefined;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `${LOCAL_HOST.test(raw) ? "http" : "https"}://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return undefined;
  }
}

const onVercel = Boolean(process.env.VERCEL);
const vercelEnv = process.env.VERCEL_ENV; // "production" | "preview" | "development"

/** Alamat publik situs, tanpa slash di akhir. */
function resolveSiteUrl() {
  const usable = (url: string | undefined) => (url && !(onVercel && LOCAL_HOST.test(url)) ? url : undefined);
  const fromEnv = usable(normalizeUrl(process.env.NEXT_PUBLIC_APP_URL)) ?? usable(normalizeUrl(process.env.BETTER_AUTH_URL));
  const deployment = normalizeUrl(process.env.VERCEL_URL);
  const production = normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  if (vercelEnv === "preview") return deployment ?? fromEnv ?? "http://localhost:3000";
  return fromEnv ?? production ?? deployment ?? "http://localhost:3000";
}

const siteUrl = resolveSiteUrl();

/**
 * Asal (origin) yang boleh memanggil API login. Better Auth menolak permintaan dari asal lain
 * dengan "Invalid origin", jadi daftar ini harus mencakup setiap alamat yang dipakai untuk membuka situs.
 */
export function trustedOrigins() {
  const origins = new Set<string>([siteUrl]);
  // Nilai localhost dari variabel biasa diabaikan di Vercel (sisa .env.local); yang ditulis sengaja
  // di AUTH_TRUSTED_ORIGINS selalu dipakai.
  const add = (value: string | undefined, explicit = false) => {
    const url = normalizeUrl(value);
    if (url && (explicit || !(onVercel && LOCAL_HOST.test(url)))) origins.add(url);
  };

  add(process.env.NEXT_PUBLIC_APP_URL);
  add(process.env.BETTER_AUTH_URL);
  add(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  add(process.env.VERCEL_URL);
  add(process.env.VERCEL_BRANCH_URL);

  // Domain dengan dan tanpa "www" dianggap sama.
  try {
    const { protocol, hostname, port } = new URL(siteUrl);
    if (!/^[\d.]+$/.test(hostname) && hostname !== "localhost") {
      const alt = hostname.startsWith("www.") ? hostname.slice(4) : `www.${hostname}`;
      origins.add(`${protocol}//${alt}${port ? `:${port}` : ""}`);
    }
  } catch {
    /* siteUrl selalu valid */
  }

  for (const extra of (process.env.AUTH_TRUSTED_ORIGINS ?? "").split(",")) add(extra, true);

  if (!onVercel && process.env.NODE_ENV !== "production") {
    for (const port of [3000, 3001, 3002]) origins.add(`http://localhost:${port}`);
  }
  return [...origins];
}

export const siteConfig = {
  name: "Kerjalin",
  tagline: "Peluang untuk Semua",
  description:
    "Kerjalin adalah platform layanan SaaS dengan jaringan agen. Jadi mitra, jual layanan digital untuk UMKM, dan dapatkan komisi tanpa modal besar.",
  url: siteUrl,
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
} as const;

/** Minimal penarikan komisi (Rupiah). */
export const MIN_WITHDRAWAL = 50_000;

/** Nama cookie untuk menyimpan kode referral dari tautan agen. */
export const REF_COOKIE = "kj_ref";

export function whatsappLink(message?: string) {
  if (!siteConfig.whatsapp) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${siteConfig.whatsapp}${text}`;
}

/** Tombol "Masuk dengan Google" hanya tampil bila kredensial OAuth sudah diisi. */
export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
