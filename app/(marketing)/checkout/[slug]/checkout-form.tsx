"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, BadgeCheck, Clock, MessageCircle, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, SubmitButton, useActionForm } from "@/components/forms/action-form";
import { FormField } from "@/components/forms/form-field";
import { MethodOptions } from "@/components/payment/method-options";
import type { PaymentMethodKey } from "@/db/schema";
import { formatIDR } from "@/lib/format";
import type { CheckoutMethod } from "@/lib/payments/meta";
import type { DisplayPlan } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { placeOrderAction } from "./actions";

export type CheckoutProduct = {
  slug: string;
  name: string;
  tagline: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  soon: boolean;
  releaseNote: string | null;
};

export function CheckoutForm({
  product,
  plans,
  initialMonths,
  seller,
  selfAgent,
  methods,
}: {
  product: CheckoutProduct;
  plans: DisplayPlan[];
  initialMonths: number;
  /** Agen dari tautan referral (cookie). */
  seller: { name: string; code: string } | null;
  /** Pengunjung adalah agen yang sedang masuk: penjualan dicatat atas namanya. */
  selfAgent: boolean;
  /** Metode bayar yang aktif. Kosong = pembayaran dikonfirmasi lewat WhatsApp. */
  methods: CheckoutMethod[];
}) {
  const { state, formProps, pending } = useActionForm(placeOrderAction, { silent: true });
  const [months, setMonths] = useState(initialMonths);
  const [methodKey, setMethodKey] = useState<PaymentMethodKey | null>(methods[0]?.key ?? null);
  const plan = plans.find((p) => p.months === months) ?? plans[0];
  const method = methods.find((m) => m.key === methodKey) ?? null;

  return (
    <form {...formProps} noValidate className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
      <input type="hidden" name="slug" value={product.slug} />
      <input type="hidden" name="paket" value={plan.months} />
      {method && <input type="hidden" name="metode" value={method.key} />}
      {/* Kolom jebakan bot: tersembunyi dari manusia dan pembaca layar. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Situs web
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-6">
        {state && !state.ok && state.error && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-negative/30 bg-negative/5 p-4 text-sm text-negative">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {state.error}
          </div>
        )}

        <section className="rounded-2xl border border-border bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-base font-bold text-navy">1. Pilih lama langganan</h2>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {plans.map((pl) => (
              <label
                key={pl.months}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-4 rounded-xl border-2 p-4 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-navy/25",
                  pl.months === months ? "border-navy bg-muted" : "border-border hover:border-navy/40",
                )}
              >
                <input type="radio" name="paket-pilihan" value={pl.months} checked={pl.months === months} onChange={() => setMonths(pl.months)} className="sr-only" />
                <span>
                  <span className="block text-sm font-bold text-navy">{pl.label}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">{formatIDR(pl.perMonth)} per bulan</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-extrabold text-navy tabular-nums">{formatIDR(pl.price)}</span>
                  {pl.saving > 0 && <span className="text-xs font-bold text-positive">Hemat {pl.saving}%</span>}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-base font-bold text-navy">2. Data pemesan</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Nama lengkap" name="nama" state={state}>
              <Input id="nama" name="nama" autoComplete="name" placeholder="mis. Bu Tini" className="h-11" required />
            </FormField>
            <FormField label="Nomor WhatsApp" name="whatsapp" state={state} hint="Kami menghubungi nomor ini untuk instruksi pembayaran.">
              <Input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" placeholder="081234567890" className="h-11" required />
            </FormField>
            <FormField label="Email (opsional)" name="email" state={state}>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="nama@email.com" className="h-11" />
            </FormField>
            <FormField label="Nama usaha (opsional)" name="usaha" state={state}>
              <Input id="usaha" name="usaha" autoComplete="organization" placeholder="mis. Laundry Bersih Jaya" className="h-11" />
            </FormField>
            <FormField label="Catatan (opsional)" name="catatan" state={state} className="sm:col-span-2">
              <Textarea id="catatan" name="catatan" rows={3} placeholder="Kebutuhan khusus, jumlah outlet, atau pertanyaan lain" />
            </FormField>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-base font-bold text-navy">3. Dilayani oleh agen</h2>
          {seller && (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted p-4 text-sm text-navy">
              <BadgeCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
              <p>
                Pesananmu dicatat atas nama agen <strong>{seller.name}</strong>. Ubah kode di bawah bila kamu dibantu agen lain.
              </p>
            </div>
          )}
          {!seller && selfAgent && (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted p-4 text-sm text-navy">
              <BadgeCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
              <p>Kamu sedang masuk sebagai agen. Pesanan ini dicatat atas namamu, kecuali kamu mengisi kode agen lain.</p>
            </div>
          )}
          <FormField label="Kode agen (opsional)" name="kodeAgen" state={state} className="mt-4 max-w-sm" hint="Kosongkan bila belum punya.">
            <Input id="kodeAgen" name="kodeAgen" defaultValue={seller?.code ?? ""} autoComplete="off" placeholder="mis. KJ7ERRTU" className="h-11 uppercase" />
          </FormField>
        </section>

        {methods.length > 0 && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-base font-bold text-navy">4. Metode pembayaran</h2>
            <div className="mt-4">
              <MethodOptions methods={methods} value={methodKey} onChange={setMethodKey} name="metode-pilihan" />
            </div>
            <div className="mt-2">
              <FieldError state={state} name="metode" />
            </div>
          </section>
        )}
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-24" aria-label="Ringkasan pesanan">
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
          <div className="relative aspect-[16/9] bg-muted">
            {product.imageUrl && <Image src={product.imageUrl} alt="" fill sizes="380px" className="object-cover" />}
          </div>
          <div className="p-5">
            {product.categoryName && <p className="text-xs font-semibold tracking-wide text-faint uppercase">{product.categoryName}</p>}
            <p className="mt-1 text-lg font-extrabold text-navy">{product.name}</p>
            <dl className="mt-4 grid gap-2.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Paket</dt>
                <dd className="font-semibold text-navy">{plan.label}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Harga per bulan</dt>
                <dd className="font-medium tabular-nums">{formatIDR(plan.perMonth)}</dd>
              </div>
              {plan.saving > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Hemat</dt>
                  <dd className="font-bold text-positive">{plan.saving}%</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex items-end justify-between gap-4 rounded-xl bg-navy p-4 text-white">
              <span className="text-sm text-white/75">Total</span>
              <span className="text-2xl leading-none font-extrabold tabular-nums">{formatIDR(plan.price)}</span>
            </div>

            <SubmitButton type="submit" size="lg" pending={pending} pendingText="Memproses…" className="mt-4 h-12 w-full rounded-xl">
              {method?.kind === "gateway" ? "Lanjut ke pembayaran" : method?.kind === "qris" ? "Pesan dan tampilkan QRIS" : "Buat Pesanan"}
            </SubmitButton>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {method?.kind === "gateway"
                ? `Kamu diarahkan ke halaman bayar ${method.label}.`
                : method?.kind === "qris"
                  ? "Kode QRIS tampil di halaman berikutnya."
                  : "Belum ada pembayaran sekarang. Kamu mendapat kode pesanan lebih dulu."}
            </p>
          </div>
        </div>

        <ul className="grid gap-3 rounded-2xl border border-border bg-muted p-4 text-sm text-navy">
          {method?.kind === "gateway" ? (
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              Pembayaran diproses {method.label}. Pesananmu otomatis lunas begitu pembayaran berhasil.
            </li>
          ) : method?.kind === "qris" ? (
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              Setelah scan QRIS, kirim konfirmasi di halaman pesanan. Admin memeriksa pembayaranmu secara manual.
            </li>
          ) : (
            <>
              <li className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                Tim Kerjalin atau agenmu menghubungi lewat WhatsApp untuk instruksi pembayaran.
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                Pembayaran dikonfirmasi manual oleh admin. Tidak ada tagihan otomatis.
              </li>
            </>
          )}
          {product.soon && (
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
              Produk ini {product.releaseNote ? `(${product.releaseNote.toLowerCase()})` : "segera hadir"}. Pesananmu berupa pemesanan awal dan layanan aktif saat produk dibuka.
            </li>
          )}
        </ul>
        <p className="text-center text-xs text-muted-foreground">
          Dengan memesan, kamu menyetujui{" "}
          <Link href="/syarat-ketentuan" className="underline underline-offset-2">
            syarat dan ketentuan
          </Link>{" "}
          Kerjalin.
        </p>
      </aside>
    </form>
  );
}
