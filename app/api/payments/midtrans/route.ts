import { connection } from "next/server";
import { handleMidtransNotification } from "@/lib/payments/service";

/**
 * Notifikasi pembayaran Midtrans (Payment Notification URL). Tanda tangan diperiksa dengan Server Key
 * yang tersimpan, jadi permintaan palsu ditolak. Daftarkan alamat ini di Dashboard Midtrans →
 * Settings → Payment → Notification URL.
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
    const { status, json } = await handleMidtransNotification(body);
    return Response.json(json, { status });
  } catch (error) {
    console.error("[webhook midtrans]", error);
    return Response.json({ error: "Notifikasi gagal diproses." }, { status: 500 });
  }
}

/** Untuk memeriksa lewat browser bahwa alamat webhook sudah aktif. */
export async function GET() {
  await connection();
  return Response.json({ ok: true, endpoint: "midtrans" });
}
