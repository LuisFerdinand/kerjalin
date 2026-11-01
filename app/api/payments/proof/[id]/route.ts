import { connection } from "next/server";
import { z } from "zod";
import { getProofFile } from "@/lib/payments/service";
import { getSession } from "@/lib/session";

/** Bukti bayar yang dikirim pelanggan. Hanya Super Admin yang boleh melihatnya, dan tidak disimpan di cache. */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") return new Response("Tidak diizinkan.", { status: 401 });

  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return new Response("Tidak ditemukan.", { status: 404 });
  const file = await getProofFile(id);
  if (!file) return new Response("Tidak ditemukan.", { status: 404 });

  return new Response(new Uint8Array(file.bytes), {
    headers: { "Content-Type": file.mime, "Cache-Control": "private, no-store" },
  });
}
