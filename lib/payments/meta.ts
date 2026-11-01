import type { PaymentMethodKey } from "@/db/schema";

/** Bagian yang aman dipakai di browser: nama, keterangan, dan isian kredensial tiap metode. Tanpa akses database. */

export const GATEWAY_KEYS = ["midtrans", "xendit"] as const;
export type GatewayKey = (typeof GATEWAY_KEYS)[number];

export function isGatewayKey(key: string): key is GatewayKey {
  return (GATEWAY_KEYS as readonly string[]).includes(key);
}

export type PaymentMeta = {
  label: string;
  /** Satu kalimat untuk pelanggan di halaman checkout. */
  customerBlurb: string;
};

export const PAYMENT_META: Record<PaymentMethodKey, PaymentMeta> = {
  midtrans: {
    label: "Midtrans",
    customerBlurb: "Virtual account bank, e-wallet, QRIS, dan kartu. Dikonfirmasi otomatis.",
  },
  xendit: {
    label: "Xendit",
    customerBlurb: "Virtual account bank, e-wallet, QRIS, dan gerai retail. Dikonfirmasi otomatis.",
  },
  qris: {
    label: "QRIS",
    customerBlurb: "Scan QRIS dari aplikasi bank atau e-wallet apa pun. Admin memeriksa pembayaranmu secara manual.",
  },
};

export type CredentialField = {
  name: string;
  label: string;
  required: boolean;
  placeholder: string;
  hint?: string;
};

export const GATEWAY_FIELDS: Record<GatewayKey, CredentialField[]> = {
  midtrans: [
    {
      name: "serverKey",
      label: "Server Key",
      required: true,
      placeholder: "SB-Mid-server-… atau Mid-server-…",
      hint: "Dashboard Midtrans → Settings → Access Keys. Server Key sandbox diawali SB-.",
    },
  ],
  xendit: [
    {
      name: "secretKey",
      label: "Secret API Key",
      required: true,
      placeholder: "xnd_development_… atau xnd_production_…",
      hint: "Dashboard Xendit → Settings → API Keys. Beri izin Money-in write dan read.",
    },
    {
      name: "callbackToken",
      label: "Callback verification token",
      required: false,
      placeholder: "Token dari pengaturan Webhook",
      hint: "Dashboard Xendit → Settings → Webhooks. Disarankan diisi agar callback palsu ditolak.",
    },
  ],
};

export const WEBHOOK_PATH: Record<GatewayKey, string> = {
  midtrans: "/api/payments/midtrans",
  xendit: "/api/payments/xendit",
};

/** Batas gambar QRIS dan bukti bayar (byte), dipakai di browser dan server. */
export const MAX_QRIS_BYTES = 2 * 1024 * 1024;
export const MAX_PROOF_BYTES = 1024 * 1024;

/** Hasil menanyakan status pembayaran: lunas, masih menunggu, gagal/kedaluwarsa, atau pesanan sudah ditutup. */
export type PaymentCheck = "paid" | "pending" | "failed" | "closed";

export type CheckoutMethod = {
  key: PaymentMethodKey;
  kind: "gateway" | "qris";
  label: string;
  description: string;
};
