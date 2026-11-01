"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { PAYMENT_METHOD_KEYS, orders, products } from "@/db/schema";
import {
  fail,
  normalizePhone,
  optionalText,
  parseForm,
  phoneSchema,
  requiredText,
  type ActionState,
} from "@/lib/action-utils";
import { REF_COOKIE } from "@/lib/config";
import { MlmError, createOrder } from "@/lib/mlm";
import { isGatewayKey } from "@/lib/payments/meta";
import { PaymentError, listCheckoutMethods, startGatewayPayment } from "@/lib/payments/service";
import { displayPlans } from "@/lib/pricing";
import { lookupSeller } from "@/lib/queries/public";
import { getAgentByUserId, getSession } from "@/lib/session";

const schema = z.object({
  slug: z.string().min(1),
  paket: z.coerce.number().int().min(1).max(60),
  nama: requiredText("Nama", 80),
  whatsapp: phoneSchema,
  email: z
    .string()
    .trim()
    .max(120, "Email maksimal 120 karakter")
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().email("Format email tidak valid").optional()),
  usaha: optionalText(100),
  catatan: optionalText(300),
  kodeAgen: optionalText(20),
  /** Metode bayar. Wajib diisi bila ada metode yang aktif. */
  metode: z.enum(PAYMENT_METHOD_KEYS).optional(),
  /** Kolom jebakan untuk bot: manusia tidak melihat dan tidak mengisinya. */
  website: z.string().optional(),
});

/** Batas pesanan menunggu per nomor WhatsApp dalam satu jam, agar formulir publik tidak dibanjiri. */
const MAX_PENDING_PER_HOUR = 3;

/**
 * Membuat pesanan dari halaman checkout. Harga selalu dihitung ulang dari paket di database,
 * bukan dari nilai yang dikirim browser. Pesanan berstatus menunggu sampai pembayaran dikonfirmasi
 * (otomatis oleh gateway, atau oleh admin untuk QRIS dan pembayaran lewat WhatsApp); saat itu komisi dibagikan.
 * Bila ada metode bayar yang aktif, pelanggan wajib memilih satu.
 */
export async function placeOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;
  if (d.website) return fail("Permintaan tidak dapat diproses.");

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, d.slug), inArray(products.status, ["active", "coming_soon"])))
    .limit(1);
  if (!product) return fail("Produk tidak ditemukan atau belum dibuka.");

  const plan = displayPlans(product).find((p) => p.months === d.paket);
  if (!plan) return fail("Paket langganan tidak tersedia.", { paket: "Pilih salah satu paket." });

  const methods = await listCheckoutMethods();
  if (methods.length > 0) {
    if (!d.metode) return fail("Pilih metode pembayaran.", { metode: "Pilih metode pembayaran." });
    if (!methods.some((m) => m.key === d.metode)) {
      return fail("Metode pembayaran itu sedang tidak tersedia. Muat ulang halaman lalu pilih lagi.", { metode: "Metode tidak tersedia." });
    }
  }
  const paymentMethod = methods.length > 0 ? (d.metode ?? null) : null;

  const phone = normalizePhone(d.whatsapp);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        eq(orders.customerPhone, phone),
        eq(orders.status, "pending"),
        gt(orders.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
      ),
    );
  if (count >= MAX_PENDING_PER_HOUR) {
    return fail("Sudah ada beberapa pesanan menunggu dengan nomor ini. Tunggu dihubungi tim kami, atau coba lagi nanti.");
  }

  // Agen penjual: kode yang diisi pembeli, lalu cookie tautan referral, lalu agen yang sedang masuk.
  let agentId: string | null = null;
  if (d.kodeAgen) {
    const seller = await lookupSeller(d.kodeAgen);
    if (!seller) return fail("Kode agen tidak ditemukan atau belum aktif.", { kodeAgen: "Kode agen tidak ditemukan atau belum aktif." });
    agentId = seller.id;
  } else {
    const cookieCode = (await cookies()).get(REF_COOKIE)?.value;
    const seller = await lookupSeller(cookieCode);
    if (seller) {
      agentId = seller.id;
    } else {
      const session = await getSession();
      const profile = session && session.user.role !== "super_admin" ? await getAgentByUserId(session.user.id) : null;
      if (profile?.agent.status === "active") agentId = profile.agent.id;
    }
  }

  let code: string;
  try {
    const order = await createOrder({
      productId: product.id,
      agentId,
      customerName: d.usaha ? `${d.nama} (${d.usaha})` : d.nama,
      customerEmail: d.email ?? null,
      customerPhone: phone,
      months: plan.months,
      amount: plan.price,
      note: ["Pesan online", product.status === "coming_soon" ? "Pre-order" : null, d.catatan].filter(Boolean).join(" · "),
      paymentMethod,
      markPaid: false,
    });
    code = order.code;
  } catch (error) {
    if (error instanceof MlmError) return fail(error.message);
    console.error("[placeOrderAction]", error);
    return fail("Pesanan belum berhasil dibuat. Coba lagi sebentar lagi.");
  }

  // Gateway: langsung ke halaman bayar. QRIS dan tanpa metode: ke halaman pesanan (QRIS tampil di sana).
  // Bila tautan bayar gagal dibuat, pesanan tetap tersimpan dan pelanggan bisa mencoba lagi dari halaman pesanan.
  let target = `/pesanan/${code}`;
  if (paymentMethod && isGatewayKey(paymentMethod)) {
    try {
      target = await startGatewayPayment(code, paymentMethod);
    } catch (error) {
      if (!(error instanceof PaymentError)) console.error("[placeOrderAction] gateway", error);
      target = `/pesanan/${code}?bayar=gagal`;
    }
  }
  redirect(target);
}
