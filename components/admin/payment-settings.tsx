"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ImagePlus, Loader2, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { saveGatewayAction, saveQrisAction, testGatewayAction } from "@/app/admin/pembayaran/actions";
import { StatusBadge } from "@/components/app/badges";
import { CopyButton } from "@/components/app/copy-button";
import { Panel } from "@/components/app/page-header";
import { FieldError, SubmitButton, useActionForm } from "@/components/forms/action-form";
import { FormField, PasswordInput } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AdminMethodView } from "@/lib/payments/service";
import { GATEWAY_FIELDS, MAX_QRIS_BYTES, PAYMENT_META, type GatewayKey } from "@/lib/payments/meta";
import { formatDateTime } from "@/lib/format";

function MethodStatus({ view }: { view: AdminMethodView }) {
  if (!view.enabled) return <StatusBadge tone="gray">Nonaktif</StatusBadge>;
  if (!view.ready) return <StatusBadge tone="amber">Belum lengkap</StatusBadge>;
  return <StatusBadge tone="green">Aktif</StatusBadge>;
}

function EnableSwitch({ defaultChecked, label, hint }: { defaultChecked: boolean; label: string; hint: string }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/50 p-3.5">
      <span>
        <span className="block text-sm font-semibold text-navy">{label}</span>
        <span className="block text-[0.8125rem] text-muted-foreground">{hint}</span>
      </span>
      <Switch name="enabled" defaultChecked={defaultChecked} />
    </label>
  );
}

function FormError({ state }: { state: ReturnType<typeof useActionForm>["state"] }) {
  if (!state || state.ok || !state.error || state.fieldErrors) return null;
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {state.error}
    </p>
  );
}

/* -------------------------------------------------------------------------- */

export function GatewayCard({
  view,
  webhookUrl,
  siteIsLocal,
}: {
  view: AdminMethodView;
  webhookUrl: string;
  siteIsLocal: boolean;
}) {
  const key = view.key as GatewayKey;
  const meta = PAYMENT_META[key];
  // Mengganti kunci form mengosongkan isian kredensial setelah tersimpan, supaya nilai yang diketik tidak tertinggal di layar.
  const [version, setVersion] = useState(0);
  const { state, formProps, pending } = useActionForm(saveGatewayAction, { onSuccess: () => setVersion((v) => v + 1) });
  const [testing, startTest] = useTransition();

  function test() {
    startTest(async () => {
      const res = await testGatewayAction(key);
      if (res?.ok) toast.success(res.message);
      else toast.error(res?.error ?? "Pengujian gagal.");
    });
  }

  return (
    <Panel
      title={
        <span className="flex flex-wrap items-center gap-2.5">
          {meta.label}
          <MethodStatus view={view} />
        </span>
      }
      description={key === "midtrans" ? "Midtrans Snap: virtual account, e-wallet, QRIS, kartu." : "Xendit Invoice: virtual account, e-wallet, QRIS, gerai retail."}
    >
      {/* method="post": bila form terkirim sebelum JavaScript siap, kunci tidak pernah masuk ke URL. */}
      <form key={version} method="post" {...formProps} noValidate className="grid gap-5">
        <input type="hidden" name="key" value={key} />

        {view.unreadable && (
          <p className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-3 text-[0.8125rem] text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            Kredensial tersimpan tidak bisa dibuka karena kunci enkripsi (PAYMENT_ENCRYPTION_KEY atau BETTER_AUTH_SECRET) berubah. Masukkan ulang di bawah.
          </p>
        )}

        <EnableSwitch
          defaultChecked={view.enabled}
          label={`Aktifkan ${meta.label} di checkout`}
          hint="Pelanggan bisa memilih metode ini saat memesan."
        />

        {key === "midtrans" && (
          <FormField label="Lingkungan" name="mode" state={state} hint="Sandbox untuk uji coba tanpa uang sungguhan. Ganti ke Produksi saat siap menerima pembayaran.">
            <NativeSelect id="mode" name="mode" defaultValue={view.mode} className="sm:max-w-xs">
              <option value="sandbox">Sandbox (uji coba)</option>
              <option value="production">Produksi</option>
            </NativeSelect>
          </FormField>
        )}

        <div className="grid gap-4">
          {GATEWAY_FIELDS[key].map((field) => (
            <FormField
              key={field.name}
              label={`${field.label}${field.required ? "" : " (opsional)"}`}
              name={field.name}
              state={state}
              hint={
                <>
                  {field.hint}
                  {view.saved[field.name] && <> Tersimpan; kosongkan untuk tetap memakai kunci lama.</>}
                </>
              }
            >
              <PasswordInput
                id={field.name}
                name={field.name}
                autoComplete="off"
                spellCheck={false}
                placeholder={view.saved[field.name] ?? field.placeholder}
                className="h-10 font-mono text-[0.8125rem]"
              />
            </FormField>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-3.5">
          <p className="text-sm font-semibold text-navy">Alamat webhook</p>
          <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
            {key === "midtrans"
              ? "Daftarkan di Dashboard Midtrans → Settings → Payment → Notification URL."
              : "Daftarkan di Dashboard Xendit → Settings → Webhooks (Invoices paid dan Invoices expired)."}
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-white px-2.5 py-1.5 text-[0.8125rem] text-navy">
              {webhookUrl}
            </code>
            <CopyButton value={webhookUrl} label="Salin" successMessage="Alamat webhook tersalin" />
          </div>
          {siteIsLocal && (
            <p className="mt-2.5 text-[0.8125rem] text-amber-800">
              Situs ini masih berjalan di localhost, jadi {meta.label} tidak bisa memanggil alamat di atas. Pesanan tetap bisa dilunasi lewat tombol
              Cek status di halaman pesanan, atau gunakan tunnel (mis. ngrok) saat menguji webhook.
            </p>
          )}
        </div>

        <FormError state={state} />

        <div className="flex flex-wrap items-center gap-2">
          <SubmitButton pending={pending} pendingText="Menyimpan…">
            Simpan
          </SubmitButton>
          <Button type="button" variant="outline" onClick={test} disabled={testing || !view.ready}>
            {testing ? <Loader2 className="animate-spin" /> : <PlugZap />}
            Uji koneksi
          </Button>
          {view.updatedAt && <p className="ml-auto text-[0.8125rem] text-muted-foreground">Diubah {formatDateTime(view.updatedAt)}</p>}
        </div>
      </form>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */

export function QrisCard({ view }: { view: AdminMethodView }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { state, formProps, pending } = useActionForm(saveQrisAction);

  async function upload(file: File) {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return toast.error("Gunakan gambar PNG, JPG, atau WebP.");
    if (file.size > MAX_QRIS_BYTES) return toast.error("Ukuran gambar maksimal 2 MB.");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/payments/qris", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Gambar gagal diunggah.");
      toast.success("Gambar QRIS diperbarui");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gambar gagal diunggah.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <Panel
      title={
        <span className="flex flex-wrap items-center gap-2.5">
          QRIS manual
          <MethodStatus view={view} />
        </span>
      }
      description="Unggah QRIS milikmu. Pelanggan memindainya dari halaman pesanan, lalu kamu memeriksa pembayarannya sendiri."
    >
      <div className="grid gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="grid size-44 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white">
            {view.qris ? (
              // eslint-disable-next-line @next/next/no-img-element -- gambar dari database, dilayani oleh route handler
              <img src={`/api/payments/qris?v=${view.qris.id}`} alt="QRIS yang sedang dipakai" className="size-full object-contain" />
            ) : (
              <ImagePlus className="size-8 text-faint" aria-hidden />
            )}
          </div>
          <div className="grid gap-2.5">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={uploading} onClick={() => input.current?.click()}>
                {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                {uploading ? "Mengunggah…" : view.qris ? "Ganti gambar QRIS" : "Unggah gambar QRIS"}
              </Button>
            </div>
            <input
              ref={input}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              aria-label="Pilih berkas gambar QRIS"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
            />
            <p className="max-w-md text-[0.8125rem] text-muted-foreground">
              PNG, JPG, atau WebP, maksimal 2 MB. Pakai QRIS statis dari bank atau penyedia pembayaranmu. Gambar berlaku langsung setelah diunggah.
            </p>
            {view.qris && (
              <p className="text-[0.8125rem] text-muted-foreground">Diunggah {formatDateTime(view.qris.updatedAt)}</p>
            )}
            <p className="max-w-md text-[0.8125rem] text-muted-foreground">
              QRIS statis tidak memuat nominal, jadi pelanggan mengetik sendiri. Karena itu halaman pesanan menampilkan total yang harus dibayar dengan tombol salin.
            </p>
          </div>
        </div>

        <form {...formProps} noValidate className="grid gap-5 border-t border-border pt-5">
          <EnableSwitch
            defaultChecked={view.enabled}
            label="Aktifkan QRIS di checkout"
            hint="Pelanggan bisa memilih QRIS saat memesan. Perlu gambar QRIS di atas."
          />
          <FormField label="Nama merchant (opsional)" name="merchantName" state={state} hint="Ditampilkan di bawah gambar agar pelanggan bisa mencocokkan nama di aplikasi bank.">
            <Input id="merchantName" name="merchantName" defaultValue={view.settings.merchantName ?? ""} maxLength={80} placeholder="mis. Kerjalin Digital" />
          </FormField>
          <FormField label="Petunjuk tambahan (opsional)" name="instructions" state={state}>
            <Textarea
              id="instructions"
              name="instructions"
              rows={3}
              maxLength={400}
              defaultValue={view.settings.instructions ?? ""}
              placeholder="mis. Pembayaran diperiksa pada jam kerja 08.00–20.00 WIB."
            />
          </FormField>
          <FieldError state={state} name="image" />
          <FormError state={state} />
          <div>
            <SubmitButton pending={pending} pendingText="Menyimpan…">
              Simpan
            </SubmitButton>
          </div>
        </form>
      </div>
    </Panel>
  );
}
