import { connection } from "next/server";
import { PaymentError } from "@/lib/payments/gateway";
import { readUploadedImage } from "@/lib/payments/images";
import { MAX_PROOF_BYTES } from "@/lib/payments/meta";
import { submitQrisConfirmation } from "@/lib/payments/service";

/**
 * Pelanggan menyatakan sudah membayar lewat QRIS, dengan bukti bayar (opsional). Publik, tetapi hanya berlaku untuk
 * pesanan QRIS yang masih menunggu, dan kode pesanan wajib benar. Bidang multipart: `code`, `note`, `file`.
 */
export async function POST(request: Request) {
  await connection();
  if (Number(request.headers.get("content-length") ?? 0) > MAX_PROOF_BYTES + 64 * 1024) {
    return Response.json({ error: "Bukti pembayaran terlalu besar (maksimal 1 MB)." }, { status: 413 });
  }
  try {
    const form = await request.formData();
    const code = String(form.get("code") ?? "").trim();
    const note = String(form.get("note") ?? "").trim().slice(0, 200);
    const file = form.get("file");
    const proof = file instanceof File && file.size > 0 ? await readUploadedImage(file, MAX_PROOF_BYTES, "Bukti pembayaran") : undefined;
    await submitQrisConfirmation({ code, note: note || undefined, proof });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof PaymentError) return Response.json({ error: error.message }, { status: 400 });
    console.error("[qris confirm]", error);
    return Response.json({ error: "Konfirmasi belum berhasil dikirim. Coba lagi." }, { status: 500 });
  }
}
