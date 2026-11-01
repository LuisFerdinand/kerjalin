import { connection } from "next/server";
import { PaymentError } from "@/lib/payments/gateway";
import { readUploadedImage } from "@/lib/payments/images";
import { MAX_QRIS_BYTES } from "@/lib/payments/meta";
import { getQrisFile, getQrisMeta, storeQrisImage } from "@/lib/payments/service";
import { getSession } from "@/lib/session";

/** Gambar QRIS milik admin untuk halaman pesanan. Publik; ETag membuat browser memeriksa dulu sebelum mengunduh ulang. */
export async function GET(request: Request) {
  await connection();
  const meta = await getQrisMeta();
  if (!meta) return new Response("QRIS belum diunggah.", { status: 404 });

  const etag = `"${meta.id}"`;
  const headers = { ETag: etag, "Cache-Control": "public, max-age=0, must-revalidate" };
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });

  const file = await getQrisFile();
  if (!file) return new Response("QRIS belum diunggah.", { status: 404 });
  const responseHeaders = new Headers({ ...headers, "Content-Type": file.mime });
  if (new URL(request.url).searchParams.has("unduh")) {
    responseHeaders.set("Content-Disposition", `attachment; filename="QRIS-Kerjalin.${file.mime.split("/")[1]}"`);
  }
  return new Response(new Uint8Array(file.bytes), { headers: responseHeaders });
}

/** Unggah atau ganti gambar QRIS. Hanya Super Admin. Dikirim sebagai multipart (bidang `file`). */
export async function POST(request: Request) {
  await connection();
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") {
    return Response.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_QRIS_BYTES + 64 * 1024) {
    return Response.json({ error: "Gambar QRIS terlalu besar (maksimal 2 MB)." }, { status: 413 });
  }
  try {
    const image = await readUploadedImage((await request.formData()).get("file"), MAX_QRIS_BYTES, "Gambar QRIS");
    await storeQrisImage(image);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof PaymentError) return Response.json({ error: error.message }, { status: 400 });
    console.error("[qris upload]", error);
    return Response.json({ error: "Gambar QRIS gagal disimpan." }, { status: 500 });
  }
}
