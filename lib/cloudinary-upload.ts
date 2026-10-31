/**
 * Unggah satu gambar ke Cloudinary lewat tanda tangan dari /api/upload/sign.
 * API secret tidak pernah sampai ke browser. Melempar Error berisi pesan yang ramah.
 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Ukuran gambar maksimal 5 MB.");

  const signRes = await fetch("/api/upload/sign", { method: "POST" });
  const sign = await signRes.json();
  if (!signRes.ok) throw new Error(sign.error ?? "Gagal menyiapkan upload.");

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sign.apiKey);
  body.append("timestamp", String(sign.timestamp));
  body.append("folder", sign.folder);
  body.append("signature", sign.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Upload ke Cloudinary gagal.");
  return data.secure_url as string;
}
