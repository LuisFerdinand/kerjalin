"use server";

import { redirect } from "next/navigation";
import { done, fail, type ActionState } from "@/lib/action-utils";
import { PAYMENT_METHOD_KEYS } from "@/db/schema";
import { isGatewayKey, type PaymentCheck } from "@/lib/payments/meta";
import { PaymentError, checkOrderPayment, startGatewayPayment, startQrisPayment } from "@/lib/payments/service";

/**
 * Pelanggan memilih (atau mengganti) cara bayar di halaman pesanan. Gateway: langsung diarahkan ke halaman bayar.
 * QRIS: halaman dimuat ulang dan menampilkan kode QRIS.
 */
export async function startPaymentAction(code: string, method: string): Promise<ActionState> {
  if (!(PAYMENT_METHOD_KEYS as readonly string[]).includes(method)) return fail("Metode pembayaran tidak dikenal.");

  let target: string;
  try {
    if (isGatewayKey(method)) {
      target = await startGatewayPayment(code, method);
    } else {
      await startQrisPayment(code);
      return done("QRIS ditampilkan.");
    }
  } catch (error) {
    if (error instanceof PaymentError) return fail(error.message);
    console.error("[startPaymentAction]", error);
    return fail("Pembayaran belum bisa dimulai. Coba lagi sebentar lagi.");
  }
  redirect(target);
}

/** Menanyakan status ke gateway, untuk tombol "Cek status" dan pengecekan otomatis setelah kembali dari halaman bayar. */
export async function checkPaymentAction(code: string): Promise<{ result: PaymentCheck } | { error: string }> {
  try {
    return { result: await checkOrderPayment(code) };
  } catch (error) {
    if (error instanceof PaymentError) return { error: error.message };
    console.error("[checkPaymentAction]", error);
    return { error: "Status belum bisa diperiksa. Coba lagi." };
  }
}
