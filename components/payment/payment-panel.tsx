"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Download, ExternalLink, ImagePlus, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { checkPaymentAction, startPaymentAction } from "@/app/(marketing)/pesanan/[code]/actions";
import { CopyButton } from "@/components/app/copy-button";
import { MethodOptions } from "@/components/payment/method-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PaymentMethodKey } from "@/db/schema";
import { formatDateTime, formatIDR } from "@/lib/format";
import { compressProof } from "@/lib/payments/client-image";
import { MAX_PROOF_BYTES, PAYMENT_META, isGatewayKey, type CheckoutMethod } from "@/lib/payments/meta";

export type PanelOrder = {
  code: string;
  amount: number;
  method: PaymentMethodKey | null;
  paymentUrl: string | null;
  /** Tautan bayar gateway sudah lewat masa berlakunya atau dibatalkan gateway. */
  linkExpired: boolean;
  /** ISO. Terisi bila pelanggan sudah mengirim konfirmasi QRIS. */
  submittedAt: string | null;
};

export type PanelQris = { imageUrl: string; merchantName: string | null; instructions: string | null };

const primaryLink =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy px-6 text-sm font-semibold text-white transition-colors hover:bg-navy-soft";

/** Bagian "Pembayaran" di halaman pesanan yang masih menunggu: pilih cara bayar, bayar, dan konfirmasi. */
export function PaymentPanel({
  order,
  methods,
  qris,
  returning,
  startFailed,
}: {
  order: PanelOrder;
  methods: CheckoutMethod[];
  qris: PanelQris | null;
  /** Pelanggan baru kembali dari halaman bayar gateway. */
  returning: boolean;
  /** Tautan bayar gagal dibuat saat checkout. */
  startFailed: boolean;
}) {
  const router = useRouter();
  const [choosing, setChoosing] = useState(order.method === null || (order.method === "qris" && !qris));
  const [picked, setPicked] = useState<PaymentMethodKey | null>(methods[0]?.key ?? null);
  const [starting, startTransition] = useTransition();

  function start(method: PaymentMethodKey) {
    startTransition(async () => {
      const res = await startPaymentAction(order.code, method);
      // Untuk gateway, aksi mengarahkan ke halaman bayar sehingga baris di bawah tidak sampai dijalankan.
      if (res && !res.ok) return void toast.error(res.error ?? "Pembayaran belum bisa dimulai.");
      setChoosing(false);
      router.refresh();
    });
  }

  if (methods.length === 0 && order.method === null) return null;

  if (choosing) {
    return (
      <div>
        <h2 className="text-base font-bold text-navy">Pilih cara membayar</h2>
        {startFailed && <FailedNote />}
        <div className="mt-4">
          <MethodOptions methods={methods} value={picked} onChange={setPicked} name="metode-pesanan" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="lg" className="h-12 rounded-xl px-6" disabled={!picked || starting} onClick={() => picked && start(picked)}>
            {starting && <Loader2 className="animate-spin" />}
            {picked && isGatewayKey(picked) ? `Bayar ${formatIDR(order.amount)}` : "Tampilkan QRIS"}
          </Button>
          {order.method !== null && (order.method !== "qris" || qris) && (
            <button type="button" onClick={() => setChoosing(false)} className="text-sm font-medium text-navy underline underline-offset-2">
              Batal
            </button>
          )}
        </div>
      </div>
    );
  }

  const changeMethod = methods.length > 1 || (methods.length === 1 && methods[0].key !== order.method) ? (
    <button type="button" onClick={() => setChoosing(true)} className="text-sm font-medium text-navy underline underline-offset-2">
      Ganti metode pembayaran
    </button>
  ) : null;

  if (order.method === "qris" && qris) {
    return <QrisView order={order} qris={qris} footer={changeMethod} />;
  }
  if (order.method && isGatewayKey(order.method)) {
    return <GatewayView order={order} returning={returning} startFailed={startFailed} onRestart={() => start(order.method!)} restarting={starting} footer={changeMethod} />;
  }
  return null;
}

function FailedNote() {
  return (
    <p role="alert" className="mt-3 flex items-start gap-2.5 rounded-xl border border-negative/30 bg-negative/5 p-3.5 text-sm text-negative">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      Tautan pembayaran belum bisa dibuat. Coba lagi, atau pilih metode lain.
    </p>
  );
}

/* -------------------------------------------------------------------------- */

function GatewayView({
  order,
  returning,
  startFailed,
  onRestart,
  restarting,
  footer,
}: {
  order: PanelOrder;
  returning: boolean;
  startFailed: boolean;
  onRestart: () => void;
  restarting: boolean;
  footer: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, startCheck] = useTransition();
  const label = PAYMENT_META[order.method as "midtrans" | "xendit"].label;
  const live = Boolean(order.paymentUrl) && !order.linkExpired;

  // Sepulang dari halaman bayar, status ditanyakan ke gateway beberapa kali karena notifikasinya bisa terlambat.
  useEffect(() => {
    if (!returning) return;
    let stopped = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function tick() {
      const res = await checkPaymentAction(order.code);
      if (stopped) return;
      if ("result" in res && res.result !== "pending") return router.refresh();
      if (++tries < 12) timer = setTimeout(tick, 5000);
    }
    timer = setTimeout(tick, 800);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [returning, order.code, router]);

  function check() {
    startCheck(async () => {
      const res = await checkPaymentAction(order.code);
      if ("error" in res) return void toast.error(res.error);
      if (res.result === "paid") {
        toast.success("Pembayaran diterima. Terima kasih!");
        router.refresh();
      } else if (res.result === "failed" || res.result === "closed") {
        toast.error("Tautan pembayaran sudah berakhir.");
        router.refresh();
      } else {
        toast.message("Belum ada pembayaran yang masuk. Coba lagi sesaat setelah membayar.");
      }
    });
  }

  return (
    <div>
      <h2 className="text-base font-bold text-navy">Bayar lewat {label}</h2>
      {startFailed && !live && <FailedNote />}
      <p className="mt-1.5 text-sm text-muted-foreground">
        {live
          ? `Selesaikan pembayaran ${formatIDR(order.amount)} di halaman ${label}. Pesananmu otomatis lunas begitu pembayaran berhasil.`
          : "Tautan pembayaran belum ada atau sudah berakhir. Buat tautan baru untuk melanjutkan."}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {live ? (
          <a href={order.paymentUrl!} className={primaryLink}>
            <ExternalLink className="size-4" aria-hidden />
            Lanjutkan pembayaran
          </a>
        ) : (
          <Button size="lg" className="h-12 rounded-xl px-6" onClick={onRestart} disabled={restarting}>
            {restarting && <Loader2 className="animate-spin" />}
            Buat tautan baru
          </Button>
        )}
        <Button size="lg" variant="outline" className="h-12 rounded-xl px-5" onClick={check} disabled={checking}>
          {checking ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Cek status pembayaran
        </Button>
      </div>
      {returning && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Memeriksa pembayaranmu…
        </p>
      )}
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function QrisView({ order, qris, footer }: { order: PanelOrder; qris: PanelQris; footer: React.ReactNode }) {
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const submitted = order.submittedAt !== null;

  return (
    <div>
      <h2 className="text-base font-bold text-navy">Bayar dengan QRIS</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-[220px_minmax(0,1fr)]">
        <figure className="grid justify-items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari database, dilayani oleh route handler */}
          <img
            src={qris.imageUrl}
            alt="Kode QRIS untuk pembayaran"
            className="aspect-square w-full max-w-[220px] rounded-2xl border border-border bg-white object-contain p-2"
          />
          <figcaption className="text-center text-[0.8125rem] text-muted-foreground">
            {qris.merchantName ? `a.n. ${qris.merchantName}` : "Scan dengan aplikasi bank atau e-wallet"}
          </figcaption>
          <a
            href={`${qris.imageUrl}&unduh=1`}
            className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-navy underline underline-offset-2"
          >
            <Download className="size-3.5" aria-hidden />
            Unduh gambar QRIS
          </a>
        </figure>

        <div className="grid content-start gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total yang harus dibayar</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <p className="text-3xl leading-none font-extrabold text-navy tabular-nums">{formatIDR(order.amount)}</p>
              <CopyButton value={String(order.amount)} label="Salin nominal" successMessage="Nominal tersalin" />
            </div>
          </div>
          <ol className="grid list-decimal gap-1.5 pl-5 text-sm text-muted-foreground marker:font-semibold marker:text-navy">
            <li>Buka aplikasi bank atau e-wallet, lalu pilih Scan / QRIS.</li>
            <li>
              Scan kode di samping, lalu masukkan nominal <strong className="text-navy">tepat {formatIDR(order.amount)}</strong>.
            </li>
            <li>Selesaikan pembayaran, lalu kirim konfirmasi di bawah ini.</li>
          </ol>
          {qris.instructions && <p className="rounded-xl bg-muted p-3.5 text-sm text-navy">{qris.instructions}</p>}
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        {submitted && !resending ? (
          <div className="flex items-start gap-3 rounded-xl border border-positive/30 bg-positive/5 p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-positive" aria-hidden />
            <div className="min-w-0 text-sm">
              <p className="font-bold text-navy">Konfirmasi terkirim ({formatDateTime(order.submittedAt)})</p>
              <p className="mt-0.5 text-muted-foreground">
                Admin memeriksa pembayaranmu secara manual. Pesanan berubah menjadi lunas setelah pembayaran terverifikasi.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => router.refresh()}>
                  <RefreshCw /> Perbarui status
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setResending(true)}>
                  Kirim ulang bukti
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <ConfirmForm code={order.code} onSent={() => setResending(false)} />
        )}
      </div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}

function ConfirmForm({ code, onSent }: { code: string; onSent: () => void }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.set("code", code);
      body.set("note", note.trim());
      if (file) body.set("file", await compressProof(file, MAX_PROOF_BYTES), "bukti-bayar.jpg");
      const res = await fetch("/api/payments/confirm", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Konfirmasi belum berhasil dikirim.");
      toast.success("Konfirmasi terkirim. Admin akan memeriksa pembayaranmu.");
      onSent();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Konfirmasi belum berhasil dikirim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <div>
        <h3 className="text-sm font-bold text-navy">Sudah membayar? Kirim konfirmasi</h3>
        <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">Bukti bayar membantu admin mencocokkan pembayaranmu lebih cepat.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Nama pengirim (opsional)
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Nama di rekening atau e-wallet" className="h-11" />
        </label>
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Bukti bayar (opsional)</span>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Pilih tangkapan layar bukti bayar"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" className="h-11 justify-start font-normal" onClick={() => fileInput.current?.click()}>
            <ImagePlus />
            <span className="truncate">{file ? file.name : "Pilih tangkapan layar"}</span>
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-negative/30 bg-negative/5 p-3.5 text-sm text-negative">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div>
        <Button type="submit" size="lg" className="h-12 rounded-xl px-6" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {busy ? "Mengirim…" : "Saya sudah bayar"}
        </Button>
      </div>
    </form>
  );
}
