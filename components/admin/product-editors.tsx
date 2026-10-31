"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage } from "@/lib/cloudinary-upload";
import { formatIDR } from "@/lib/format";
import type { PricingPlan, ProductFaq, ProductSpec } from "@/db/schema";

/* -------------------------------------------------------------------------- */
/*  Editor baris generik: menyimpan array sebagai JSON di input tersembunyi.   */
/* -------------------------------------------------------------------------- */

type Keyed<T> = T & { _k: number };

function useRows<T extends object>(initial: T[]) {
  const counter = useRef(initial.length);
  const [rows, setRows] = useState<Keyed<T>[]>(() => initial.map((r, i) => ({ ...r, _k: i })));
  const strip = (list: Keyed<T>[]) => list.map((r) => {
    const { _k: _omit, ...rest } = r;
    void _omit;
    return rest;
  });
  return {
    rows,
    json: JSON.stringify(strip(rows)),
    add(row: T) {
      counter.current += 1;
      setRows((r) => [...r, { ...row, _k: counter.current }]);
    },
    update(key: number, patch: Partial<T>) {
      setRows((r) => r.map((x) => (x._k === key ? { ...x, ...patch } : x)));
    },
    remove(key: number) {
      setRows((r) => r.filter((x) => x._k !== key));
    },
    replace(next: T[]) {
      setRows(next.map((r) => {
        counter.current += 1;
        return { ...r, _k: counter.current };
      }));
    },
  };
}

function AddRowButton({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={disabled}>
      <Plus /> {children}
    </Button>
  );
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={onClick} aria-label={label}>
      <Trash2 className="text-negative" />
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Harga & paket                                                              */
/* -------------------------------------------------------------------------- */

export function PricingEditor({
  defaultPrice,
  defaultPlans,
}: {
  defaultPrice: number;
  defaultPlans: PricingPlan[];
}) {
  const [price, setPrice] = useState(String(defaultPrice));
  const plans = useRows<{ months: number | string; label: string; price: number | string }>(
    defaultPlans.map((p) => ({ months: p.months, label: p.label ?? "", price: p.price })),
  );
  const base = Number(price) || 0;

  function autoFill() {
    if (!base) return toast.error("Isi harga bulanan dulu.");
    const tiers: [number, number, string][] = [
      [1, 0, "Bulanan"],
      [3, 5, "3 bulan"],
      [6, 10, "6 bulan"],
      [12, 15, "Tahunan"],
    ];
    plans.replace(
      tiers.map(([months, discount, label]) => ({
        months,
        label,
        price: Math.round((base * months * (100 - discount)) / 100 / 1000) * 1000,
      })),
    );
  }

  return (
    <div className="grid gap-5">
      <input type="hidden" name="pricingPlans" value={plans.json} />
      <div className="grid max-w-xs gap-1.5">
        <label htmlFor="priceMonthly" className="text-sm font-medium">
          Harga bulanan (Rp)
        </label>
        <Input
          id="priceMonthly"
          name="priceMonthly"
          type="number"
          min={0}
          step={1000}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className="tabular-nums"
        />
        <p className="text-[0.8125rem] text-muted-foreground">Harga normal per bulan. Dasar perhitungan hemat pada paket.</p>
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Paket langganan</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={autoFill}>
              Isi otomatis dari harga bulanan
            </Button>
            <AddRowButton onClick={() => plans.add({ months: 1, label: "", price: base })} disabled={plans.rows.length >= 6}>
              Tambah paket
            </AddRowButton>
          </div>
        </div>

        {plans.rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-input px-4 py-5 text-sm text-muted-foreground">
            Belum ada paket. Pelanggan hanya melihat harga bulanan. Tambahkan paket 3, 6, atau 12 bulan agar ada pilihan
            lama langganan.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[0.8125rem] text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Lama (bulan)</th>
                  <th className="px-3 py-2.5 font-medium">Nama paket</th>
                  <th className="px-3 py-2.5 text-right font-medium">Total harga (Rp)</th>
                  <th className="px-3 py-2.5 text-right font-medium">Per bulan</th>
                  <th className="px-3 py-2.5 text-right font-medium">Hemat</th>
                  <th className="w-10 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {plans.rows.map((p) => {
                  const months = Number(p.months) || 0;
                  const total = Number(p.price) || 0;
                  const perMonth = months ? Math.round(total / months) : 0;
                  const saving = base && months ? Math.round((1 - perMonth / base) * 100) : 0;
                  return (
                    <tr key={p._k} className="border-b border-rule last:border-0">
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          value={p.months}
                          onChange={(e) => plans.update(p._k, { months: e.target.value })}
                          aria-label="Lama langganan dalam bulan"
                          className="h-9 w-24 tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={p.label}
                          onChange={(e) => plans.update(p._k, { label: e.target.value })}
                          placeholder="mis. Tahunan"
                          aria-label="Nama paket"
                          className="h-9"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          step={1000}
                          value={p.price}
                          onChange={(e) => plans.update(p._k, { price: e.target.value })}
                          aria-label="Total harga paket"
                          className="ml-auto h-9 w-36 text-right tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatIDR(perMonth)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {saving > 0 ? <span className="font-medium text-positive">{saving}%</span> : <span className="text-faint">-</span>}
                      </td>
                      <td className="px-2 py-2">
                        <RemoveButton onClick={() => plans.remove(p._k)} label="Hapus paket" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Spesifikasi & FAQ                                                          */
/* -------------------------------------------------------------------------- */

export function SpecsEditor({ defaultValue }: { defaultValue: ProductSpec[] }) {
  const rows = useRows<ProductSpec>(defaultValue);
  return (
    <div className="grid gap-2.5">
      <input type="hidden" name="specs" value={rows.json} />
      {rows.rows.map((r) => (
        <div key={r._k} className="grid grid-cols-[1fr_1.6fr_auto] items-center gap-2">
          <Input value={r.label} onChange={(e) => rows.update(r._k, { label: e.target.value })} placeholder="Label, mis. Platform" aria-label="Label spesifikasi" />
          <Input value={r.value} onChange={(e) => rows.update(r._k, { value: e.target.value })} placeholder="Nilai, mis. Web dan Android" aria-label="Nilai spesifikasi" />
          <RemoveButton onClick={() => rows.remove(r._k)} label="Hapus spesifikasi" />
        </div>
      ))}
      <div>
        <AddRowButton onClick={() => rows.add({ label: "", value: "" })} disabled={rows.rows.length >= 12}>
          Tambah spesifikasi
        </AddRowButton>
      </div>
    </div>
  );
}

export function FaqEditor({ defaultValue }: { defaultValue: ProductFaq[] }) {
  const rows = useRows<ProductFaq>(defaultValue);
  return (
    <div className="grid gap-3">
      <input type="hidden" name="faqs" value={rows.json} />
      {rows.rows.map((r) => (
        <div key={r._k} className="grid gap-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <Input value={r.q} onChange={(e) => rows.update(r._k, { q: e.target.value })} placeholder="Pertanyaan" aria-label="Pertanyaan" />
            <RemoveButton onClick={() => rows.remove(r._k)} label="Hapus pertanyaan" />
          </div>
          <Textarea value={r.a} onChange={(e) => rows.update(r._k, { a: e.target.value })} rows={2} placeholder="Jawaban" aria-label="Jawaban" />
        </div>
      ))}
      <div>
        <AddRowButton onClick={() => rows.add({ q: "", a: "" })} disabled={rows.rows.length >= 10}>
          Tambah pertanyaan
        </AddRowButton>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Galeri gambar                                                              */
/* -------------------------------------------------------------------------- */

export function GalleryEditor({ defaultValue, max = 8 }: { defaultValue: string[]; max?: number }) {
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files).slice(0, Math.max(0, max - urls.length))) {
        const url = await uploadImage(file);
        setUrls((u) => [...u, url]);
      }
      toast.success("Gambar diunggah");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload gagal.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  function move(i: number, dir: -1 | 1) {
    setUrls((u) => {
      const next = [...u];
      const j = i + dir;
      if (j < 0 || j >= next.length) return u;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name="gallery" value={JSON.stringify(urls)} />
      {urls.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {urls.map((u, i) => (
            <li key={`${u}-${i}`} className="overflow-hidden rounded-lg border border-border">
              <div className="aspect-[4/3] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau URL bebas di form admin */}
                <img src={u} alt="" className="size-full object-cover" />
              </div>
              <div className="flex items-center justify-between px-1 py-1">
                <span className="flex">
                  <Button type="button" variant="ghost" size="icon-xs" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Geser ke kiri">
                    <ArrowLeft />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" disabled={i === urls.length - 1} onClick={() => move(i, 1)} aria-label="Geser ke kanan">
                    <ArrowRight />
                  </Button>
                </span>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => setUrls((l) => l.filter((_, k) => k !== i))} aria-label="Hapus gambar">
                  <X />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy || urls.length >= max} onClick={() => input.current?.click()}>
          {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {busy ? "Mengunggah..." : "Unggah gambar"}
        </Button>
        <span className="text-[0.8125rem] text-muted-foreground">
          {urls.length}/{max} gambar. Urutan pertama tampil lebih dulu setelah sampul.
        </span>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Pilih berkas gambar galeri"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      <div className="flex gap-2">
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="atau tempel URL gambar (https://res.cloudinary.com/... atau /images/...)"
          className="h-9 text-[0.8125rem]"
          aria-label="URL gambar galeri"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          disabled={!manual.trim() || urls.length >= max}
          onClick={() => {
            setUrls((u) => [...u, manual.trim()]);
            setManual("");
          }}
        >
          Tambah
        </Button>
      </div>
    </div>
  );
}
