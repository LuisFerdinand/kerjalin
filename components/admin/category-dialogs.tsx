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
import { FormDialog } from "@/components/forms/form-dialog";
import { FormField } from "@/components/forms/form-field";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/kategori/actions";

export type CategoryFormData = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
};

export function CategoryFormDialog({
  category,
  nextOrder,
  trigger,
}: {
  category?: CategoryFormData;
  nextOrder: number;
  trigger: ReactNode;
}) {
  return (
    <FormDialog
      title={category ? `Ubah kategori ${category.name}` : "Kategori baru"}
      description="Kategori dipakai untuk mengelompokkan produk dan sebagai filter di katalog."
      trigger={trigger}
      action={saveCategoryAction}
      submitLabel={category ? "Simpan perubahan" : "Tambah kategori"}
    >
      {(state) => (
        <>
          {category?.id && <input type="hidden" name="id" value={category.id} />}
          <FormField label="Nama kategori" name="name" state={state}>
            <Input id="name" name="name" defaultValue={category?.name} required />
          </FormField>
          <FormField label="Slug URL" name="slug" state={state} hint="Kosongkan untuk dibuat otomatis dari nama.">
            <Input id="slug" name="slug" defaultValue={category?.slug} placeholder="laundry" />
          </FormField>
          <FormField label="Deskripsi" name="description" state={state}>
            <Textarea id="description" name="description" rows={2} defaultValue={category?.description ?? ""} />
          </FormField>
          <FormField label="Urutan tampil" name="sortOrder" state={state} hint="Angka kecil tampil lebih dulu.">
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={category?.sortOrder ?? nextOrder}
              className="w-28 tabular-nums"
            />
          </FormField>
        </>
      )}
    </FormDialog>
  );
}

export function DeleteCategoryButton({ id, name, productCount }: { id: string; name: string; productCount: number }) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const res = await deleteCategoryAction(id);
    setBusy(false);
    if (res?.ok) toast.success(res.message);
    else toast.error(res?.error ?? "Gagal menghapus kategori");
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Hapus kategori ${name}`}>
          <Trash2 className="text-negative" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus kategori “{name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {productCount > 0
              ? `${productCount} produk di kategori ini akan menjadi tanpa kategori. Produknya tidak ikut terhapus.`
              : "Kategori ini belum dipakai produk apa pun."}
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
