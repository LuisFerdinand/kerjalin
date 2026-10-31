"use client";

import { useState, type ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialog } from "@/components/forms/form-dialog";
import { FormField } from "@/components/forms/form-field";
import { ImageUploader } from "@/components/forms/image-uploader";
import { deleteProductAction, saveProductAction } from "@/app/admin/produk/actions";
import type { ProductStatus } from "@/db/schema";

export type ProductFormData = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  tagline: string | null;
  description: string | null;
  priceMonthly: number;
  features: string[];
  status: ProductStatus;
  sortOrder: number;
  imageUrl: string | null;
};

export function ProductFormDialog({
  product,
  nextOrder,
  trigger,
}: {
  product?: ProductFormData;
  nextOrder: number;
  trigger: ReactNode;
}) {
  return (
    <FormDialog
      title={product ? `Ubah ${product.name}` : "Tambah produk"}
      description="Produk SaaS yang ditampilkan di situs dan katalog agen."
      trigger={trigger}
      action={saveProductAction}
      submitLabel={product ? "Simpan perubahan" : "Tambah produk"}
      size="lg"
    >
      {(state) => (
        <>
          {product?.id && <input type="hidden" name="id" value={product.id} />}
          <FormField label="Gambar produk" name="imageUrl" state={state}>
            <ImageUploader name="imageUrl" defaultValue={product?.imageUrl} label="Gambar produk" />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nama produk" name="name" state={state}>
              <Input id="name" name="name" defaultValue={product?.name} required className="h-10" />
            </FormField>
            <FormField label="Kategori" name="category" state={state}>
              <Input id="category" name="category" defaultValue={product?.category ?? "Bisnis"} required className="h-10" />
            </FormField>
          </div>

          <FormField label="Tagline" name="tagline" state={state}>
            <Input id="tagline" name="tagline" defaultValue={product?.tagline ?? ""} className="h-10" />
          </FormField>

          <FormField label="Deskripsi" name="description" state={state}>
            <Textarea id="description" name="description" rows={4} defaultValue={product?.description ?? ""} />
          </FormField>

          <FormField label="Fitur unggulan" name="features" state={state} hint="Satu fitur per baris (maks. 12).">
            <Textarea id="features" name="features" rows={4} defaultValue={product?.features.join("\n") ?? ""} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Harga / bulan (Rp)" name="priceMonthly" state={state}>
              <Input
                id="priceMonthly"
                name="priceMonthly"
                type="number"
                min={0}
                step={1000}
                defaultValue={product?.priceMonthly ?? 100000}
                required
                className="h-10"
              />
            </FormField>
            <FormField label="Status" name="status" state={state}>
              <Select name="status" defaultValue={product?.status ?? "coming_soon"}>
                <SelectTrigger id="status" className="h-10 w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif (bisa dijual)</SelectItem>
                  <SelectItem value="coming_soon">Segera hadir</SelectItem>
                  <SelectItem value="draft">Draf (disembunyikan)</SelectItem>
                  <SelectItem value="archived">Diarsipkan</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Urutan tampil" name="sortOrder" state={state}>
              <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={product?.sortOrder ?? nextOrder} className="h-10" />
            </FormField>
          </div>

          <FormField label="Slug URL" name="slug" state={state} hint="Kosongkan untuk dibuat otomatis dari nama.">
            <Input id="slug" name="slug" defaultValue={product?.slug} placeholder="laundry-saas" className="h-10" />
          </FormField>
        </>
      )}
    </FormDialog>
  );
}

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const res = await deleteProductAction(id);
    setBusy(false);
    if (res?.ok) toast.success(res.message);
    else toast.error(res?.error ?? "Gagal menghapus produk");
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${name}`}>
          <Trash2 className="text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus “{name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Produk akan hilang dari situs dan katalog agen. Riwayat pesanan tetap tersimpan. Untuk
            menyembunyikan sementara, ubah statusnya menjadi Draf.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={remove} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
