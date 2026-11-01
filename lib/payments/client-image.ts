/**
 * Mengecilkan tangkapan layar bukti bayar di browser sebelum dikirim, supaya unggahan kecil dan cepat
 * (juga di koneksi seluler). Hasilnya JPEG; bila masih terlalu besar, ukurannya diturunkan bertahap.
 */
export async function compressProof(file: File, maxBytes: number): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Pilih berkas gambar (JPG atau PNG).");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Gambar tidak bisa dibaca. Coba tangkapan layar dalam format JPG atau PNG.");
  }

  try {
    for (const [side, quality] of [
      [1280, 0.82],
      [1024, 0.7],
      [800, 0.6],
    ] as const) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Browser tidak bisa memproses gambar.");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= maxBytes) return blob;
    }
  } finally {
    bitmap.close();
  }
  throw new Error("Gambar terlalu besar. Pilih tangkapan layar yang lebih kecil.");
}
