import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, type Tx } from "@/db";
import {
  orders,
  paymentFiles,
  paymentMethods,
  type Order,
  type PaymentMethodKey,
  type PaymentMethodRow,
  type PaymentMode,
} from "@/db/schema";
import { siteConfig, siteIsLocal } from "@/lib/config";
import { MlmError, markOrderPaid, randomCode } from "@/lib/mlm";
import { decryptJson, encryptJson } from "@/lib/secret-box";
import {
  PaymentError,
  midtransCreate,
  midtransOutcome,
  midtransPing,
  midtransStatus,
  xenditCreate,
  xenditPing,
  xenditStatus,
  type GatewayStatus,
} from "./gateway";
import type { StoredImage } from "./images";
import {
  GATEWAY_FIELDS,
  PAYMENT_META,
  isGatewayKey,
  type CheckoutMethod,
  type GatewayKey,
  type PaymentCheck,
} from "./meta";

export { PaymentError } from "./gateway";

/** Uang pelanggan masuk lewat sini, lalu komisi dibagikan oleh `markOrderPaid` di lib/mlm.ts. */

type Credentials = Record<string, string>;

/** Lama transaksi gateway berlaku sebelum kedaluwarsa. */
const PAY_WINDOW_HOURS = 24;

/* -------------------------------------------------------------------------- */
/*  Pembaca konfigurasi                                                        */
/* -------------------------------------------------------------------------- */

async function readRow(key: PaymentMethodKey) {
  const [row] = await db.select().from(paymentMethods).where(eq(paymentMethods.key, key)).limit(1);
  return row ?? null;
}

function readCredentials(row: PaymentMethodRow | null): Credentials | null {
  if (!row?.credentials) return null;
  try {
    return decryptJson<Credentials>(row.credentials);
  } catch (error) {
    console.error("[payments] kunci enkripsi tidak tersedia", error);
    return null;
  }
}

function gatewayReady(key: GatewayKey, creds: Credentials | null) {
  return GATEWAY_FIELDS[key].every((f) => !f.required || Boolean(creds?.[f.name]));
}

async function latestQris() {
  const [file] = await db
    .select({ id: paymentFiles.id, mime: paymentFiles.mime, size: paymentFiles.size, createdAt: paymentFiles.createdAt })
    .from(paymentFiles)
    .where(eq(paymentFiles.kind, "qris"))
    .orderBy(desc(paymentFiles.createdAt))
    .limit(1);
  return file ?? null;
}

export const getQrisMeta = latestQris;

/** Metode yang aktif dan siap dipakai pelanggan, berurutan: gateway dulu, QRIS terakhir. */
export async function listCheckoutMethods(): Promise<CheckoutMethod[]> {
  const rows = await db.select().from(paymentMethods).where(eq(paymentMethods.enabled, true));
  const out: CheckoutMethod[] = [];
  for (const key of ["midtrans", "xendit", "qris"] as const) {
    const row = rows.find((r) => r.key === key);
    if (!row) continue;
    const ready = isGatewayKey(key) ? gatewayReady(key, readCredentials(row)) : Boolean(await latestQris());
    if (!ready) continue;
    out.push({
      key,
      kind: key === "qris" ? "qris" : "gateway",
      label: PAYMENT_META[key].label,
      description: PAYMENT_META[key].customerBlurb,
    });
  }
  return out;
}

/** Gambar dan keterangan QRIS untuk halaman pesanan. null bila QRIS belum siap. */
export async function getQrisDisplay() {
  const [row, file] = await Promise.all([readRow("qris"), latestQris()]);
  if (!row?.enabled || !file) return null;
  return {
    imageId: file.id,
    merchantName: row.settings.merchantName || null,
    instructions: row.settings.instructions || null,
  };
}

/** Gambar QRIS terbaru, untuk route handler. */
export async function getQrisFile() {
  const meta = await latestQris();
  if (!meta) return null;
  const [file] = await db.select({ data: paymentFiles.data }).from(paymentFiles).where(eq(paymentFiles.id, meta.id)).limit(1);
  return file ? { ...meta, bytes: Buffer.from(file.data, "base64") } : null;
}

export async function getProofFile(id: string) {
  const [file] = await db
    .select({ mime: paymentFiles.mime, data: paymentFiles.data })
    .from(paymentFiles)
    .where(and(eq(paymentFiles.id, id), eq(paymentFiles.kind, "proof")))
    .limit(1);
  return file ? { mime: file.mime, bytes: Buffer.from(file.data, "base64") } : null;
}

/* -------------------------------------------------------------------------- */
/*  Pengaturan di panel admin                                                  */
/* -------------------------------------------------------------------------- */

export type AdminMethodView = {
  key: PaymentMethodKey;
  enabled: boolean;
  mode: PaymentMode;
  ready: boolean;
  /** Isian kredensial yang sudah tersimpan → petunjuk samar (4 karakter terakhir). Nilai aslinya tidak keluar dari server. */
  saved: Record<string, string>;
  /** Kredensial tersimpan tetapi tidak bisa dibuka (kunci enkripsi berubah). */
  unreadable: boolean;
  settings: Record<string, string>;
  qris: { id: string; size: number; updatedAt: Date } | null;
  updatedAt: Date | null;
};

function maskTail(value: string) {
  return value.length > 8 ? `••••••••${value.slice(-4)}` : "••••••••";
}

export async function getAdminMethodViews(): Promise<AdminMethodView[]> {
  const [rows, qris] = await Promise.all([db.select().from(paymentMethods), latestQris()]);
  return (["midtrans", "xendit", "qris"] as const).map((key) => {
    const row = rows.find((r) => r.key === key) ?? null;
    const creds = readCredentials(row);
    const saved: Record<string, string> = {};
    for (const [name, value] of Object.entries(creds ?? {})) if (value) saved[name] = maskTail(value);
    return {
      key,
      enabled: row?.enabled ?? false,
      mode: row?.mode ?? "sandbox",
      ready: isGatewayKey(key) ? gatewayReady(key, creds) : Boolean(qris),
      saved,
      unreadable: Boolean(row?.credentials) && !creds,
      settings: row?.settings ?? {},
      qris: key === "qris" && qris ? { id: qris.id, size: qris.size, updatedAt: qris.createdAt } : null,
      updatedAt: row?.updatedAt ?? null,
    };
  });
}

export async function saveGatewaySettings(input: {
  key: GatewayKey;
  enabled: boolean;
  mode: PaymentMode;
  values: Record<string, string | undefined>;
  userId: string;
}) {
  const row = await readRow(input.key);
  const merged: Credentials = { ...(readCredentials(row) ?? {}) };
  for (const field of GATEWAY_FIELDS[input.key]) {
    const value = input.values[field.name]?.trim();
    if (value) merged[field.name] = value;
  }

  if (input.enabled) {
    for (const field of GATEWAY_FIELDS[input.key]) {
      if (field.required && !merged[field.name]) {
        throw new PaymentError(`${field.label} wajib diisi sebelum metode diaktifkan.`, field.name);
      }
    }
  }
  if (input.key === "midtrans" && merged.serverKey) {
    const sandboxKey = merged.serverKey.startsWith("SB-");
    if (input.mode === "sandbox" && !sandboxKey) {
      throw new PaymentError("Mode sandbox memakai Server Key yang diawali SB-. Ganti kuncinya, atau pilih mode produksi.", "serverKey");
    }
    if (input.mode === "production" && sandboxKey) {
      throw new PaymentError("Server Key ini milik sandbox. Pilih mode sandbox, atau pakai Server Key produksi.", "serverKey");
    }
  }
  if (input.key === "xendit" && merged.secretKey && !merged.secretKey.startsWith("xnd_")) {
    throw new PaymentError("Secret API Key Xendit diawali xnd_development_ atau xnd_production_.", "secretKey");
  }

  const values = {
    enabled: input.enabled,
    mode: input.mode,
    credentials: Object.keys(merged).length > 0 ? encryptJson(merged) : null,
    updatedBy: input.userId,
  };
  await db
    .insert(paymentMethods)
    .values({ key: input.key, ...values })
    .onConflictDoUpdate({ target: paymentMethods.key, set: values });
}

/** Mengganti gambar QRIS. Hanya gambar terbaru yang dipakai; yang lama dibuang agar tabel tidak menumpuk. */
export async function storeQrisImage(image: StoredImage) {
  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(paymentFiles)
      .values({ kind: "qris", mime: image.mime, size: image.bytes.length, data: image.bytes.toString("base64") })
      .returning({ id: paymentFiles.id });
    await tx.delete(paymentFiles).where(and(eq(paymentFiles.kind, "qris"), ne(paymentFiles.id, created.id)));
  });
  revalidatePath("/admin/pembayaran");
}

export async function saveQrisSettings(input: {
  enabled: boolean;
  merchantName?: string;
  instructions?: string;
  userId: string;
}) {
  if (input.enabled && !(await latestQris())) {
    throw new PaymentError("Unggah gambar QRIS sebelum mengaktifkan metode ini.", "image");
  }
  const values = {
    enabled: input.enabled,
    settings: { merchantName: input.merchantName ?? "", instructions: input.instructions ?? "" },
    updatedBy: input.userId,
  };
  await db
    .insert(paymentMethods)
    .values({ key: "qris", ...values })
    .onConflictDoUpdate({ target: paymentMethods.key, set: values });
}

/** Menguji kunci yang tersimpan ke gateway. Mengembalikan pesan hasil untuk admin. */
export async function testGateway(key: GatewayKey): Promise<{ ok: boolean; message: string }> {
  const row = await readRow(key);
  const creds = readCredentials(row);
  if (!row || !gatewayReady(key, creds) || !creds) return { ok: false, message: "Simpan kredensial terlebih dahulu." };
  try {
    const accepted =
      key === "midtrans"
        ? await midtransPing({ serverKey: creds.serverKey, mode: row.mode })
        : await xenditPing({ secretKey: creds.secretKey });
    return accepted
      ? { ok: true, message: `${PAYMENT_META[key].label} menerima kunci ini.` }
      : { ok: false, message: `${PAYMENT_META[key].label} menolak kunci ini. Periksa kunci dan mode.` };
  } catch (error) {
    if (error instanceof PaymentError) return { ok: false, message: error.message };
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*  Alur pembayaran pelanggan                                                  */
/* -------------------------------------------------------------------------- */

/** Kode pesanan di balik referensi gateway "<kode>_<acak>". */
function orderCodeOf(ref: string) {
  return ref.split("_")[0];
}

async function findOrder(code: string) {
  const [order] = await db.select().from(orders).where(eq(orders.code, code.trim().toUpperCase())).limit(1);
  return order ?? null;
}

async function requirePendingOrder(code: string) {
  const order = await findOrder(code);
  if (!order) throw new PaymentError("Pesanan tidak ditemukan.");
  if (order.status !== "pending") throw new PaymentError("Pesanan ini sudah tidak menunggu pembayaran.");
  return order;
}

export function revalidateOrderViews(code?: string) {
  revalidatePath("/admin/pesanan");
  revalidatePath("/admin/agen");
  revalidatePath("/admin/pohon");
  revalidatePath("/admin");
  revalidatePath("/dashboard", "layout");
  if (code) revalidatePath(`/pesanan/${code}`);
}

/**
 * Tandai lunas dan bagikan komisi. Idempoten. Bila pesanan ternyata sudah dibatalkan di saat yang sama,
 * uangnya tetap masuk tetapi tidak ada yang diubah otomatis: dicatat di log agar admin menindaklanjuti.
 */
async function settle(order: Pick<Order, "id" | "code">) {
  try {
    await markOrderPaid(order.id);
  } catch (error) {
    if (!(error instanceof MlmError)) throw error;
    console.error(`[payments] pesanan ${order.code} tidak bisa ditandai lunas (${error.message}). Tindak lanjuti manual.`);
    return;
  }
  revalidateOrderViews(order.code);
}

/**
 * Membuat transaksi di gateway dan mengembalikan tautan bayarnya. Transaksi yang masih berlaku dipakai ulang,
 * jadi mengklik "Bayar" dua kali tidak membuat tagihan ganda.
 */
export async function startGatewayPayment(code: string, key: GatewayKey): Promise<string> {
  const order = await requirePendingOrder(code);
  const row = await readRow(key);
  const creds = readCredentials(row);
  if (!row?.enabled || !creds || !gatewayReady(key, creds)) {
    throw new PaymentError("Metode pembayaran ini sedang tidak tersedia. Pilih metode lain.");
  }

  const stillValid = !order.paymentExpiresAt || order.paymentExpiresAt.getTime() > Date.now() + 5 * 60_000;
  if (order.paymentMethod === key && order.paymentUrl && order.paymentRef && stillValid) return order.paymentUrl;

  const ref = `${order.code}_${randomCode(4)}`;
  const returnUrl = `${siteConfig.url}/pesanan/${order.code}?kembali=1`;
  const created =
    key === "midtrans"
      ? await midtransCreate({
          serverKey: creds.serverKey,
          mode: row.mode,
          ref,
          amount: order.amount,
          itemName: `${order.productName} (${order.months} bln)`,
          customer: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
          finishUrl: returnUrl,
          expiryHours: PAY_WINDOW_HOURS,
        })
      : await xenditCreate({
          secretKey: creds.secretKey,
          ref,
          amount: order.amount,
          description: `Kerjalin ${order.productName} ${order.months} bulan (${order.code})`,
          payerEmail: order.customerEmail,
          returnUrl: siteIsLocal ? null : returnUrl,
          durationSeconds: PAY_WINDOW_HOURS * 3600,
        });

  await db
    .update(orders)
    .set({
      paymentMethod: key,
      paymentRef: ref,
      paymentUrl: created.url,
      paymentExpiresAt: created.expiresAt,
      paymentSubmittedAt: null,
      paymentNote: null,
    })
    .where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
  revalidatePath(`/pesanan/${order.code}`);
  return created.url;
}

/** Pelanggan memilih QRIS manual: halaman pesanan menampilkan gambar QRIS dan formulir konfirmasi. */
export async function startQrisPayment(code: string) {
  const order = await requirePendingOrder(code);
  if (!(await getQrisDisplay())) throw new PaymentError("QRIS sedang tidak tersedia. Pilih metode lain.");
  await db
    .update(orders)
    .set({ paymentMethod: "qris", paymentRef: null, paymentUrl: null, paymentExpiresAt: null })
    .where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
  revalidatePath(`/pesanan/${order.code}`);
}

/**
 * Pelanggan menyatakan sudah membayar lewat QRIS. Bukti (opsional) disimpan, lalu pesanan masuk antrean
 * verifikasi admin. Pesanan baru lunas setelah admin menandainya.
 */
export async function submitQrisConfirmation(input: { code: string; note?: string; proof?: StoredImage }) {
  const order = await requirePendingOrder(input.code);
  if (order.paymentMethod !== "qris") throw new PaymentError("Pesanan ini tidak memakai QRIS.");

  await db.transaction(async (tx) => {
    if (input.proof) await saveProof(tx, order.id, input.proof);
    await tx
      .update(orders)
      .set({ paymentSubmittedAt: new Date(), paymentNote: input.note ?? null })
      .where(eq(orders.id, order.id));
  });
  revalidateOrderViews(order.code);
}

async function saveProof(tx: Tx, orderId: string, proof: StoredImage) {
  // Satu bukti per pesanan: kirim ulang menggantikan yang lama.
  await tx.delete(paymentFiles).where(and(eq(paymentFiles.orderId, orderId), eq(paymentFiles.kind, "proof")));
  await tx.insert(paymentFiles).values({
    kind: "proof",
    orderId,
    mime: proof.mime,
    size: proof.bytes.length,
    data: proof.bytes.toString("base64"),
  });
}

/** ID bukti bayar terbaru untuk satu pesanan (admin). */
export async function getProofId(orderId: string) {
  const [file] = await db
    .select({ id: paymentFiles.id })
    .from(paymentFiles)
    .where(and(eq(paymentFiles.orderId, orderId), eq(paymentFiles.kind, "proof")))
    .orderBy(desc(paymentFiles.createdAt))
    .limit(1);
  return file?.id ?? null;
}

async function gatewayStatusFor(order: Order): Promise<GatewayStatus> {
  if (!order.paymentRef || (order.paymentMethod !== "midtrans" && order.paymentMethod !== "xendit")) {
    return { outcome: "pending", amount: null };
  }
  const row = await readRow(order.paymentMethod);
  const creds = readCredentials(row);
  if (!row || !creds || !gatewayReady(order.paymentMethod, creds)) return { outcome: "pending", amount: null };
  return order.paymentMethod === "midtrans"
    ? midtransStatus({ serverKey: creds.serverKey, mode: row.mode, ref: order.paymentRef })
    : xenditStatus({ secretKey: creds.secretKey, ref: order.paymentRef });
}

/**
 * Menanyakan status transaksi ke gateway. Dipakai tombol "Cek status" dan saat pelanggan kembali dari halaman bayar,
 * jadi pesanan tetap lunas walau webhook terlambat atau belum terpasang.
 */
export async function checkOrderPayment(code: string): Promise<PaymentCheck> {
  const order = await findOrder(code);
  if (!order) throw new PaymentError("Pesanan tidak ditemukan.");
  if (order.status === "paid") return "paid";
  if (order.status !== "pending") return "closed";

  const status = await gatewayStatusFor(order);
  if (status.outcome === "paid") {
    if (status.amount !== null && status.amount < order.amount) {
      console.error("[payments] nominal tidak cocok", order.code, status.amount, order.amount);
      throw new PaymentError("Nominal pembayaran tidak sesuai dengan pesanan. Hubungi tim Kerjalin.");
    }
    await settle(order);
    return "paid";
  }
  if (status.outcome === "failed") {
    await expirePaymentLink(order);
    return "failed";
  }
  return "pending";
}

/** Tautan bayar yang kedaluwarsa dibuang supaya halaman pesanan menawarkan pembayaran baru. */
async function expirePaymentLink(order: Pick<Order, "id" | "code" | "paymentRef">) {
  if (!order.paymentRef) return;
  await db
    .update(orders)
    .set({ paymentUrl: null, paymentExpiresAt: null })
    .where(and(eq(orders.id, order.id), eq(orders.paymentRef, order.paymentRef)));
  revalidatePath(`/pesanan/${order.code}`);
}

/* -------------------------------------------------------------------------- */
/*  Webhook gateway                                                            */
/* -------------------------------------------------------------------------- */

type HookResult = { status: number; json: Record<string, unknown> };

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const text = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");

function safeEqual(a: string, b: string) {
  const digest = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/** Menangani pesanan yang sudah ditutup tetapi uangnya tetap masuk: tidak diubah otomatis, admin yang menindaklanjuti. */
function logOrphanPayment(order: Pick<Order, "code" | "status">, via: string) {
  console.error(`[payments] ${via}: dana masuk untuk pesanan ${order.code} berstatus ${order.status}. Tindak lanjuti manual.`);
}

export async function handleMidtransNotification(body: unknown): Promise<HookResult> {
  const data = asRecord(body);
  const orderId = text(data.order_id);
  const statusCode = text(data.status_code);
  const gross = text(data.gross_amount);
  const signature = text(data.signature_key);
  if (!orderId || !statusCode || !gross || !signature) return { status: 400, json: { error: "Payload tidak lengkap." } };

  const creds = readCredentials(await readRow("midtrans"));
  if (!creds?.serverKey) return { status: 503, json: { error: "Midtrans belum dikonfigurasi." } };

  const expected = createHash("sha512").update(orderId + statusCode + gross + creds.serverKey).digest("hex");
  if (!safeEqual(expected, signature)) return { status: 401, json: { error: "Tanda tangan tidak valid." } };

  const order = await findOrder(orderCodeOf(orderId));
  if (!order) return { status: 200, json: { ok: true, ignored: "pesanan tidak dikenal" } };

  const outcome = midtransOutcome(data);
  if (outcome === "paid") {
    if (Number(gross) !== order.amount) {
      console.error("[payments] midtrans: nominal tidak cocok", order.code, gross, order.amount);
      return { status: 200, json: { ok: true, ignored: "nominal tidak cocok" } };
    }
    if (order.status === "pending") await settle(order);
    else if (order.status !== "paid") logOrphanPayment(order, "midtrans");
  } else if (outcome === "failed" && order.status === "pending" && order.paymentRef === orderId) {
    await expirePaymentLink(order);
  }
  return { status: 200, json: { ok: true } };
}

export async function handleXenditCallback(body: unknown, callbackToken: string | null): Promise<HookResult> {
  const data = asRecord(body);
  const ref = text(data.external_id);
  if (!ref) return { status: 400, json: { error: "Payload tidak lengkap." } };

  const creds = readCredentials(await readRow("xendit"));
  if (!creds?.secretKey) return { status: 503, json: { error: "Xendit belum dikonfigurasi." } };
  if (creds.callbackToken && !safeEqual(callbackToken ?? "", creds.callbackToken)) {
    return { status: 401, json: { error: "Token callback tidak valid." } };
  }

  const order = await findOrder(orderCodeOf(ref));
  if (!order) return { status: 200, json: { ok: true, ignored: "pesanan tidak dikenal" } };

  // Isi callback tidak dipercaya begitu saja: status dan nominal dikonfirmasi langsung ke Xendit.
  const real = await xenditStatus({ secretKey: creds.secretKey, ref });
  if (real.outcome === "paid") {
    if (real.amount === null || real.amount < order.amount) {
      console.error("[payments] xendit: nominal tidak cocok", order.code, real.amount, order.amount);
      return { status: 200, json: { ok: true, ignored: "nominal tidak cocok" } };
    }
    if (order.status === "pending") await settle(order);
    else if (order.status !== "paid") logOrphanPayment(order, "xendit");
  } else if (real.outcome === "failed" && order.status === "pending" && order.paymentRef === ref) {
    await expirePaymentLink(order);
  }
  return { status: 200, json: { ok: true } };
}
