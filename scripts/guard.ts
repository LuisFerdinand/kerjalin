/**
 * Data contoh memakai akun dengan password yang diketahui umum. Jangan pernah ada di database produksi,
 * karena siapa pun bisa masuk memakainya. Skrip seed data contoh berhenti bila lingkungannya terlihat
 * seperti produksi, kecuali dijalankan dengan --allow-production.
 */
export function looksLikeProduction() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) return true;
  const app = process.env.NEXT_PUBLIC_APP_URL;
  if (!app) return false;
  try {
    return !["localhost", "127.0.0.1", "[::1]"].includes(new URL(app).hostname);
  } catch {
    return false;
  }
}

export function refuseDemoInProduction(allowed: boolean) {
  if (looksLikeProduction() && !allowed) {
    console.error("Dihentikan: lingkungan ini terlihat seperti produksi (NEXT_PUBLIC_APP_URL bukan localhost).");
    console.error("Data contoh memakai akun dengan password yang diketahui umum. Pakai database terpisah untuk pengembangan.");
    process.exit(1);
  }
}
