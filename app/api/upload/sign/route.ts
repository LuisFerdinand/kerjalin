import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/**
 * Menandatangani upload langsung ke Cloudinary (signed upload).
 * API secret tidak pernah dikirim ke browser. Hanya Super Admin yang boleh mengunggah.
 */
export async function POST() {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary belum dikonfigurasi. Isi kredensial di .env.local." },
      { status: 501 },
    );
  }

  const folder = process.env.CLOUDINARY_FOLDER || "kerjalin";
  const timestamp = Math.floor(Date.now() / 1000);
  // Parameter yang ditandatangani harus urut abjad.
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
