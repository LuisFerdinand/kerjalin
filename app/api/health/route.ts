import { connection } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Pemeriksaan kesehatan untuk uptime monitor dan untuk memastikan deploy baru bisa menjangkau database.
 * Tidak menampilkan rahasia atau data apa pun.
 */
export async function GET() {
  await connection();
  const started = Date.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json(
      { ok: true, database: "ok", ms: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[health] database tidak terjangkau", error);
    return Response.json(
      { ok: false, database: "error", ms: Date.now() - started },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
