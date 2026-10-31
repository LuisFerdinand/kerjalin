import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { siteConfig } from "@/lib/config";

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? siteConfig.url,
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
  // Saat development, izinkan port lokal lain (mis. bila 3000 sedang terpakai).
  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
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
