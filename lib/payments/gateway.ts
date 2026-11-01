import "server-only";
import type { PaymentMode } from "@/db/schema";

/** Galat yang aman ditampilkan ke pengguna. `field` menandai isian form yang salah, bila ada. */
export class PaymentError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

/** Hasil yang sama untuk semua gateway: lunas, masih menunggu, atau gagal/kedaluwarsa. */
export type GatewayOutcome = "paid" | "pending" | "failed";

export type GatewayStatus = {
  outcome: GatewayOutcome;
  /** Nominal yang tercatat di gateway (Rupiah), untuk dicocokkan dengan pesanan. */
  amount: number | null;
};

type Json = Record<string, unknown>;

async function request(url: string, init: RequestInit & { auth: string }, label: string) {
  const { auth, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Basic ${Buffer.from(`${auth}:`).toString("base64")}`,
        ...headers,
      },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new PaymentError(`${label} tidak dapat dihubungi. Coba lagi sebentar lagi.`);
  }
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* badan bukan JSON */
  }
  return { status: res.status, ok: res.ok, body };
}

const asRecord = (v: unknown): Json => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {});

/* -------------------------------------------------------------------------- */
/*  Midtrans (Snap)                                                            */
/* -------------------------------------------------------------------------- */

const MIDTRANS = {
  sandbox: { snap: "https://app.sandbox.midtrans.com", api: "https://api.sandbox.midtrans.com" },
  production: { snap: "https://app.midtrans.com", api: "https://api.midtrans.com" },
} as const;

export async function midtransCreate(input: {
  serverKey: string;
  mode: PaymentMode;
  ref: string;
  amount: number;
  itemName: string;
  customer: { name: string; email: string | null; phone: string | null };
  finishUrl: string;
  expiryHours: number;
}) {
  const { status, ok, body } = await request(
    `${MIDTRANS[input.mode].snap}/snap/v1/transactions`,
    {
      method: "POST",
      auth: input.serverKey,
      body: JSON.stringify({
        transaction_details: { order_id: input.ref, gross_amount: input.amount },
        item_details: [{ id: input.ref.slice(0, 50), price: input.amount, quantity: 1, name: input.itemName.slice(0, 50) }],
        customer_details: {
          first_name: input.customer.name.slice(0, 50),
          ...(input.customer.email ? { email: input.customer.email } : {}),
          ...(input.customer.phone ? { phone: input.customer.phone } : {}),
        },
        callbacks: { finish: input.finishUrl },
        expiry: { unit: "hours", duration: input.expiryHours },
      }),
    },
    "Midtrans",
  );
  const data = asRecord(body);
  if (!ok || typeof data.redirect_url !== "string") {
    if (status === 401) throw new PaymentError("Midtrans menolak Server Key. Periksa kredensial dan mode sandbox/produksi di panel admin.");
    const messages = Array.isArray(data.error_messages) ? data.error_messages.filter((m) => typeof m === "string") : [];
    console.error("[midtrans.create]", status, messages);
    throw new PaymentError(`Midtrans: ${messages[0] ?? "transaksi tidak dapat dibuat"}.`);
  }
  return { url: data.redirect_url, expiresAt: new Date(Date.now() + input.expiryHours * 3_600_000) };
}

/** Memetakan status transaksi Midtrans (dari status API maupun notifikasi) ke hasil umum. */
export function midtransOutcome(data: Json): GatewayOutcome {
  const status = String(data.transaction_status ?? "");
  const fraud = String(data.fraud_status ?? "accept");
  if (status === "settlement") return "paid";
  if (status === "capture") return fraud === "accept" ? "paid" : "pending";
  if (["deny", "cancel", "expire", "failure"].includes(status)) return "failed";
  return "pending";
}

export async function midtransStatus(input: { serverKey: string; mode: PaymentMode; ref: string }): Promise<GatewayStatus> {
  const { status, body } = await request(
    `${MIDTRANS[input.mode].api}/v2/${encodeURIComponent(input.ref)}/status`,
    { method: "GET", auth: input.serverKey },
    "Midtrans",
  );
  if (status === 401) throw new PaymentError("Midtrans menolak Server Key.");
  const data = asRecord(body);
  // Transaksi Snap baru ada di Midtrans setelah pelanggan memilih saluran bayar. Sebelum itu statusnya 404.
  if (String(data.status_code) === "404") return { outcome: "pending", amount: null };
  const amount = Number(data.gross_amount);
  return { outcome: midtransOutcome(data), amount: Number.isFinite(amount) ? amount : null };
}

/** 401 = kunci salah. Selain itu (termasuk 404 untuk order uji) berarti kunci diterima. */
export async function midtransPing(input: { serverKey: string; mode: PaymentMode }) {
  const { status } = await request(
    `${MIDTRANS[input.mode].api}/v2/kerjalin-ping-test/status`,
    { method: "GET", auth: input.serverKey },
    "Midtrans",
  );
  return status !== 401;
}

/* -------------------------------------------------------------------------- */
/*  Xendit (Invoice)                                                           */
/* -------------------------------------------------------------------------- */

const XENDIT = "https://api.xendit.co";

export async function xenditCreate(input: {
  secretKey: string;
  ref: string;
  amount: number;
  description: string;
  payerEmail: string | null;
  /** null = jangan kirim tautan kembali (mis. situs masih di localhost). */
  returnUrl: string | null;
  durationSeconds: number;
}) {
  const { status, ok, body } = await request(
    `${XENDIT}/v2/invoices`,
    {
      method: "POST",
      auth: input.secretKey,
      body: JSON.stringify({
        external_id: input.ref,
        amount: input.amount,
        currency: "IDR",
        description: input.description.slice(0, 250),
        invoice_duration: input.durationSeconds,
        ...(input.payerEmail ? { payer_email: input.payerEmail } : {}),
        ...(input.returnUrl ? { success_redirect_url: input.returnUrl, failure_redirect_url: input.returnUrl } : {}),
      }),
    },
    "Xendit",
  );
  const data = asRecord(body);
  if (!ok || typeof data.invoice_url !== "string") {
    if (status === 401) throw new PaymentError("Xendit menolak Secret API Key. Periksa kredensial di panel admin.");
    if (status === 403) throw new PaymentError("Secret API Key Xendit belum punya izin Money-in (Invoices) write.");
    console.error("[xendit.create]", status, data.error_code, data.message);
    throw new PaymentError(`Xendit: ${typeof data.message === "string" ? data.message : "invoice tidak dapat dibuat"}.`);
  }
  const expiry = typeof data.expiry_date === "string" ? new Date(data.expiry_date) : null;
  return {
    url: data.invoice_url,
    expiresAt: expiry && !Number.isNaN(expiry.getTime()) ? expiry : new Date(Date.now() + input.durationSeconds * 1000),
  };
}

export function xenditOutcome(statusText: unknown): GatewayOutcome {
  const status = String(statusText ?? "").toUpperCase();
  if (status === "PAID" || status === "SETTLED") return "paid";
  if (status === "EXPIRED") return "failed";
  return "pending";
}

export async function xenditStatus(input: { secretKey: string; ref: string }): Promise<GatewayStatus> {
  const { status, body } = await request(
    `${XENDIT}/v2/invoices?external_id=${encodeURIComponent(input.ref)}`,
    { method: "GET", auth: input.secretKey },
    "Xendit",
  );
  if (status === 401) throw new PaymentError("Xendit menolak Secret API Key.");
  const invoice = asRecord(Array.isArray(body) ? body[0] : null);
  if (!invoice.id) return { outcome: "pending", amount: null };
  const amount = Number(invoice.paid_amount ?? invoice.amount);
  return { outcome: xenditOutcome(invoice.status), amount: Number.isFinite(amount) ? amount : null };
}

/** 401 = kunci salah. 200, atau 403 (kunci benar tapi tanpa izin saldo) berarti kunci diterima. */
export async function xenditPing(input: { secretKey: string }) {
  const { status } = await request(`${XENDIT}/balance`, { method: "GET", auth: input.secretKey }, "Xendit");
  return status !== 401;
}
