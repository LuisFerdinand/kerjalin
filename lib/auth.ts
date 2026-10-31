import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { siteConfig, trustedOrigins } from "@/lib/config";

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

const isBuild = process.env.NEXT_PHASE === "phase-production-build";

// Tanpa secret, sesi tidak aman dan login gagal dengan pesan yang membingungkan.
// Dicek saat server berjalan, bukan saat build, supaya build di CI tidak butuh rahasia.
if (process.env.NODE_ENV === "production" && !isBuild && !process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    "BETTER_AUTH_SECRET belum diisi. Isi di Vercel → Settings → Environment Variables (buat dengan: openssl rand -base64 32).",
  );
}

export const auth = betterAuth({
  baseURL: siteConfig.url,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  // Alamat yang boleh memanggil API login: domain situs, domain produksi dan preview Vercel,
  // varian www, dan AUTH_TRUSTED_ORIGINS. Lihat lib/config.ts.
  trustedOrigins: trustedOrigins(),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : {},
  user: {
    additionalFields: {
      // Tidak bisa diisi dari klien — hanya diubah lewat server/seed.
      role: { type: "string", defaultValue: "agent", input: false },
    },
  },
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  plugins: [nextCookies()],
});

export const isGoogleAuthEnabled = googleEnabled;
