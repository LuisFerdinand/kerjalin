import "server-only";
import { PaymentError } from "./gateway";

export type StoredImage = { mime: "image/png" | "image/jpeg" | "image/webp"; bytes: Buffer };

function sniff(bytes: Buffer): StoredImage["mime"] | null {
  if (bytes.length > 12 && bytes[0] === 0x89 && bytes.toString("latin1", 1, 4) === "PNG") return "image/png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 12 && bytes.toString("latin1", 0, 4) === "RIFF" && bytes.toString("latin1", 8, 12) === "WEBP") return "image/webp";
  return null;
}

/**
 * Membaca berkas gambar dari form multipart. Jenis berkas ditentukan dari isinya (bukan dari klaim browser),
 * karena gambar ini nanti dilayani langsung dari domain situs.
 */
export async function readUploadedImage(file: unknown, maxBytes: number, label: string): Promise<StoredImage> {
  if (!(file instanceof File) || file.size === 0) throw new PaymentError(`${label} belum dipilih.`, "image");
  if (file.size > maxBytes) {
    throw new PaymentError(`${label} terlalu besar (maksimal ${Math.round(maxBytes / 1024 / 1024)} MB).`, "image");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = sniff(bytes);
  if (!mime) throw new PaymentError(`${label} harus berupa gambar PNG, JPG, atau WebP.`, "image");
  return { mime, bytes };
}
