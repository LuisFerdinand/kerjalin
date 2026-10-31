import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

/**
 * Koneksi Neon via WebSocket (Pool) supaya mendukung transaksi.
 * Dibuat malas (lazy): mengimpor modul ini tidak butuh DATABASE_URL, hanya saat query pertama.
 * Pool disimpan di globalThis agar tidak dibuat ulang saat hot reload.
 */
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL belum diisi. Salin .env.example ke .env.local lalu isi nilainya.",
    );
  }
  const globalForDb = globalThis as unknown as { __kerjalinPool?: Pool };
  globalForDb.__kerjalinPool ??= new Pool({ connectionString: url });
  return drizzle(globalForDb.__kerjalinPool, { schema });
}

export type Db = ReturnType<typeof createDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

let instance: Db | undefined;

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    instance ??= createDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export * from "./schema";
