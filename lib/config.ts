export const siteConfig = {
  name: "Kerjalin",
  tagline: "Peluang untuk Semua",
  description:
    "Kerjalin adalah platform layanan SaaS dengan jaringan agen. Jadi mitra, jual layanan digital untuk UMKM, dan dapatkan komisi tanpa modal besar.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
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
