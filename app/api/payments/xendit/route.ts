import { connection } from "next/server";
import { handleXenditCallback } from "@/lib/payments/service";

/**
 * Callback invoice Xendit ("Invoices paid" dan "Invoices expired"). Status pembayaran dikonfirmasi ulang
 * ke Xendit dengan Secret API Key, dan token callback diperiksa bila sudah diisi di panel admin.
 * Daftarkan alamat ini di Dashboard Xendit → Settings → Webhooks.
 */
export async function POST(request: Request) {
  await connection();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Isi permintaan bukan JSON." }, { status: 400 });
  }
  try {
    const { status, json } = await handleXenditCallback(body, request.headers.get("x-callback-token"));
    return Response.json(json, { status });
  } catch (error) {
    console.error("[webhook xendit]", error);
    return Response.json({ error: "Callback gagal diproses." }, { status: 500 });
  }
}

/** Untuk memeriksa lewat browser bahwa alamat webhook sudah aktif. */
export async function GET() {
  await connection();
  return Response.json({ ok: true, endpoint: "xendit" });
}
