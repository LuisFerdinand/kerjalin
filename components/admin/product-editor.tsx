"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton, useActionForm } from "@/components/forms/action-form";
import { FormField } from "@/components/forms/form-field";
import { ImageUploader } from "@/components/forms/image-uploader";
import { Panel } from "@/components/app/page-header";
import { FaqEditor, GalleryEditor, PricingEditor, SpecsEditor } from "@/components/admin/product-editors";
import {
  deleteProductAction,
  duplicateProductAction,
  saveProductAction,
} from "@/app/admin/produk/actions";
import { formatDate, formatIDR } from "@/lib/format";
import type { Product } from "@/db/schema";

type Props = {
  product: Product | null;
  categories: { id: string; name: string }[];
  nextOrder: number;
  stats?: { sold: number; pending: number; revenue: number; lastOrderAt: Date | null };
  created?: boolean;
};

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className={value.length > max ? "text-negative" : undefined}>
      {value.length}/{max}
    </span>
  );
}

export function ProductEditor({ product, categories, nextOrder, stats, created }: Props) {
  const router = useRouter();
  const { state, formProps, pending } = useActionForm(saveProductAction);
  const [name, setName] = useState(product?.name ?? "");
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [duplicating, startDuplicate] = useTransition();
  const [deleting, setDeleting] = useState(false);

  const publicStatus = product && (product.status === "active" || product.status === "coming_soon");
  const errorSummary = state && !state.ok && state.fieldErrors ? Object.values(state.fieldErrors) : [];

  async function remove() {
    if (!product) return;
    setDeleting(true);
    const res = await deleteProductAction(product.id);
    if (res?.ok) {
      toast.success(res.message);
      router.replace("/admin/produk");
    } else {
      setDeleting(false);
      toast.error(res?.error ?? "Gagal menghapus produk");
    }
  }

  return (
    <form {...formProps} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-6">
        {created && (
          <p role="status" className="rounded-xl bg-[#dcfae5] px-4 py-3 text-sm font-medium text-[#04250e]">
            Produk berhasil dibuat sebagai draf. Lengkapi detailnya, lalu ubah status menjadi Aktif atau Segera hadir untuk
            menampilkannya di situs.
          </p>
        )}
        {errorSummary.length > 0 && (
          <div role="alert" className="rounded-xl bg-[#ffedea] px-4 py-3 text-sm text-[#831c1e]">
            <p className="font-semibold">Periksa kembali isian berikut:</p>
            <ul className="mt-1 list-disc pl-5">
              {[...new Set(errorSummary)].map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        <Panel title="Informasi dasar">
          <div className="grid gap-4">
            <FormField label="Nama produk" name="name" state={state}>
              <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Kategori" name="categoryId" state={state}>
                <Select name="categoryId" defaultValue={product?.categoryId ?? "none"}>
                  <SelectTrigger id="categoryId" className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa kategori</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="SKU" name="sku" state={state} hint="Kode internal, opsional.">
                <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} placeholder="KJ-LDY-001" />
              </FormField>
            </div>
            <FormField
              label="Slug URL"
              name="slug"
              state={state}
              hint={`Alamat halaman: /produk/${slug || name ? (slug || "otomatis-dari-nama") : ""}`}
            >
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="dibuat otomatis dari nama"
              />
            </FormField>
            <FormField
              label="Tagline"
              name="tagline"
              state={state}
              hint={
                <>
                  Satu kalimat di daftar produk. <Counter value={tagline} max={160} />
                </>
              }
            >
              <Input id="tagline" name="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Label singkat" name="badge" state={state} hint="Muncul di daftar, mis. Terlaris atau Baru.">
                <Input id="badge" name="badge" defaultValue={product?.badge ?? ""} maxLength={24} />
              </FormField>
              <FormField label="Keterangan rilis" name="releaseNote" state={state} hint="Untuk status Segera hadir, mis. Kuartal 1 2027.">
                <Input id="releaseNote" name="releaseNote" defaultValue={product?.releaseNote ?? ""} />
              </FormField>
            </div>
          </div>
        </Panel>

        <Panel title="Deskripsi" description="Penjelasan lengkap di halaman produk. Pisahkan paragraf dengan baris kosong.">
          <FormField label="Deskripsi produk" name="description" state={state}>
            <Textarea id="description" name="description" rows={9} defaultValue={product?.description ?? ""} />
          </FormField>
        </Panel>

        <Panel title="Gambar" description="Sampul tampil di daftar dan di awal galeri halaman produk.">
          <div className="grid gap-6">
            <FormField label="Gambar sampul" name="imageUrl" state={state}>
              <ImageUploader name="imageUrl" defaultValue={product?.imageUrl} label="Gambar sampul" />
            </FormField>
            <FormField label="Galeri tambahan" name="gallery" state={state}>
              <GalleryEditor defaultValue={product?.gallery ?? []} />
            </FormField>
          </div>
        </Panel>

        <Panel title="Harga & paket" description="Paket menentukan pilihan lama langganan dan total yang dibayar pelanggan. Komisi agen dihitung dari total tersebut.">
          <FormField label="" name="pricingPlans" state={state}>
            <PricingEditor defaultPrice={product?.priceMonthly ?? 100000} defaultPlans={product?.pricingPlans ?? []} />
          </FormField>
          {state && !state.ok && state.fieldErrors?.priceMonthly && (
            <p role="alert" className="mt-2 text-[0.8125rem] font-medium text-destructive">
              {state.fieldErrors.priceMonthly}
            </p>
          )}
        </Panel>

        <Panel title="Fitur & spesifikasi">
          <div className="grid gap-6">
            <FormField label="Fitur unggulan" name="features" state={state} hint="Satu fitur per baris, maksimal 12.">
              <Textarea id="features" name="features" rows={6} defaultValue={product?.features.join("\n") ?? ""} />
            </FormField>
            <FormField label="Spesifikasi" name="specs" state={state}>
              <SpecsEditor defaultValue={product?.specs ?? []} />
            </FormField>
          </div>
        </Panel>

        <Panel title="Pertanyaan umum (FAQ)" description="Tampil di halaman produk untuk menjawab keraguan calon pelanggan.">
          <FormField label="" name="faqs" state={state}>
            <FaqEditor defaultValue={product?.faqs ?? []} />
          </FormField>
        </Panel>

        <Panel title="Demo & SEO">
          <div className="grid gap-4">
            <FormField label="Tautan demo" name="demoUrl" state={state} hint="Opsional. Halaman demo atau situs produk.">
              <Input id="demoUrl" name="demoUrl" type="url" defaultValue={product?.demoUrl ?? ""} placeholder="https://" />
            </FormField>
            <FormField
              label="Judul SEO"
              name="seoTitle"
              state={state}
              hint={
                <>
                  Kosongkan untuk memakai nama produk. <Counter value={seoTitle} max={70} />
                </>
              }
            >
              <Input id="seoTitle" name="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </FormField>
            <FormField
              label="Deskripsi SEO"
              name="seoDescription"
              state={state}
              hint={
                <>
                  Kosongkan untuk memakai tagline. <Counter value={seoDescription} max={170} />
                </>
              }
            >
              <Textarea
                id="seoDescription"
                name="seoDescription"
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </FormField>
            <div className="rounded-lg bg-muted/60 p-4">
              <p className="mb-2 text-[0.8125rem] text-muted-foreground">Pratinjau di mesin pencari</p>
              <p className="truncate text-[1.0625rem] font-medium text-[#1a0dab]">
                {(seoTitle || name || "Nama produk") + " | Kerjalin"}
              </p>
              <p className="truncate text-[0.8125rem] text-positive">kerjalin.id › produk › {slug || "slug-produk"}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {seoDescription || tagline || "Deskripsi produk akan tampil di sini."}
              </p>
            </div>
          </div>
        </Panel>

        <div className="lg:hidden">
          <SubmitButton pending={pending} size="lg" className="w-full" pendingText="Menyimpan...">
            Simpan produk
          </SubmitButton>
        </div>
      </div>

      <aside className="grid gap-6 lg:sticky lg:top-16">
        <Panel title="Publikasi">
          <div className="grid gap-4">
            <FormField label="Status" name="status" state={state}>
              <Select name="status" defaultValue={product?.status ?? "draft"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif: bisa dijual</SelectItem>
                  <SelectItem value="coming_soon">Segera hadir</SelectItem>
                  <SelectItem value="draft">Draf: disembunyikan</SelectItem>
                  <SelectItem value="archived">Diarsipkan</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-medium text-navy">Produk unggulan</span>
                <span className="block text-[0.8125rem] text-muted-foreground">Tampil lebih dulu di daftar.</span>
              </span>
              <Switch name="featured" defaultChecked={product?.featured} />
            </label>
            <FormField label="Urutan tampil" name="sortOrder" state={state} hint="Angka kecil tampil lebih dulu.">
              <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={product?.sortOrder ?? nextOrder} className="w-28 tabular-nums" />
            </FormField>
            <SubmitButton pending={pending} size="lg" pendingText="Menyimpan..." className="hidden w-full lg:inline-flex">
              {product ? "Simpan perubahan" : "Buat produk"}
            </SubmitButton>
            {publicStatus && (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/produk/${product.slug}`} target="_blank">
                  <ExternalLink /> Lihat di situs
                </Link>
              </Button>
            )}
          </div>
        </Panel>

        {product && stats && (
          <Panel title="Penjualan">
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Langganan terjual</dt>
                <dd className="font-semibold tabular-nums text-navy">{stats.sold}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Omzet</dt>
                <dd className="font-semibold tabular-nums text-navy">{formatIDR(stats.revenue)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Belum lunas</dt>
                <dd className="font-semibold tabular-nums text-navy">{stats.pending}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Pesanan terakhir</dt>
                <dd className="text-navy">{stats.lastOrderAt ? formatDate(stats.lastOrderAt) : "-"}</dd>
              </div>
            </dl>
            <Button asChild variant="ghost" size="sm" className="-ml-2 mt-2">
              <Link href={`/admin/pesanan?q=${encodeURIComponent(product.name)}`}>Lihat pesanan produk ini</Link>
            </Button>
          </Panel>
        )}

        {product && (
          <Panel title="Kelola">
            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={duplicating}
                onClick={() => startDuplicate(() => duplicateProductAction(product.id))}
              >
                {duplicating ? <Loader2 className="animate-spin" /> : <Copy />} Duplikat produk
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" className="text-negative hover:text-negative">
                    <Trash2 /> Hapus produk
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus “{product.name}”?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Produk hilang dari situs dan katalog agen. Riwayat pesanan tetap tersimpan. Untuk menyembunyikan
                      sementara, ubah statusnya menjadi Draf.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={remove} disabled={deleting}>
                      {deleting && <Loader2 className="animate-spin" />} Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Panel>
        )}
      </aside>
    </form>
  );
}
