import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * Enkripsi kredensial yang disimpan di database (AES-256-GCM). Kunci diturunkan dari PAYMENT_ENCRYPTION_KEY,
 * atau BETTER_AUTH_SECRET bila yang pertama kosong. Bila kunci diganti, kredensial lama tidak bisa dibuka
 * lagi dan harus dimasukkan ulang di /admin/pembayaran.
 */
const PREFIX = "v1";

let cachedKey: { source: string; key: Buffer } | undefined;

function getKey() {
  const source = process.env.PAYMENT_ENCRYPTION_KEY?.trim() || process.env.BETTER_AUTH_SECRET?.trim();
  if (!source) {
    throw new Error("Kunci enkripsi belum diisi. Isi PAYMENT_ENCRYPTION_KEY (atau BETTER_AUTH_SECRET) di environment.");
  }
  if (cachedKey?.source !== source) {
    cachedKey = { source, key: scryptSync(source, "kerjalin.payment-credentials", 32) };
  }
  return cachedKey.key;
}

export function encryptJson(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [PREFIX, iv.toString("base64"), cipher.getAuthTag().toString("base64"), body.toString("base64")].join(":");
}

/** null bila format salah atau kunci enkripsi sudah berbeda. */
export function decryptJson<T>(payload: string | null | undefined): T | null {
  if (!payload) return null;
  const [prefix, iv, tag, body] = payload.split(":");
  if (prefix !== PREFIX || !iv || !tag || !body) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    const plain = Buffer.concat([decipher.update(Buffer.from(body, "base64")), decipher.final()]);
    return JSON.parse(plain.toString("utf8")) as T;
  } catch {
    return null;
  }
}
