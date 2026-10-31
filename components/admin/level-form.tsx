"use client";

import { useState, type ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialog } from "@/components/forms/form-dialog";
import { FormField } from "@/components/forms/form-field";
import { deleteLevelAction, saveLevelAction } from "@/app/admin/level/actions";

export type LevelFormData = {
  id?: string;
  name: string;
  rank: number;
  description: string | null;
  color: string;
  commissionPercent: string;
  overridePercents: number[];
  maxDownlines: number | null;
  downlineLevelId: string | null;
  isDefault: boolean;
};

const swatches = ["#F5A524", "#0B78F0", "#12A06B", "#7C5CFA", "#E5484D", "#082052"];

export function LevelFormDialog({
  level,
  allLevels,
  nextRank,
  trigger,
}: {
  level?: LevelFormData;
  allLevels: { id: string; name: string }[];
  nextRank: number;
  trigger: ReactNode;
}) {
  const [color, setColor] = useState(level?.color ?? "#0B78F0");
  const options = allLevels.filter((l) => l.id !== level?.id);

  return (
    <FormDialog
      title={level ? `Ubah level ${level.name}` : "Tambah level agen"}
      description="Atur komisi, bonus tim, jumlah slot downline, dan level yang didapat rekrutan."
      trigger={trigger}
      action={saveLevelAction}
      submitLabel={level ? "Simpan perubahan" : "Buat level"}
      size="lg"
    >
      {(state) => (
        <>
          {level?.id && <input type="hidden" name="id" value={level.id} />}
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <FormField label="Nama level" name="name" state={state}>
              <Input id="name" name="name" defaultValue={level?.name} placeholder="mis. Agen Utama" required className="h-10" />
            </FormField>
            <FormField label="Urutan" name="rank" state={state} hint="1 = tertinggi">
              <Input id="rank" name="rank" type="number" min={1} defaultValue={level?.rank ?? nextRank} required className="h-10" />
            </FormField>
          </div>

          <FormField label="Deskripsi singkat" name="description" state={state}>
            <Textarea id="description" name="description" rows={2} defaultValue={level?.description ?? ""} />
          </FormField>

          <FormField label="Warna lencana" name="color" state={state}>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="color"
                type="color"
                name="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-10 cursor-pointer rounded-lg border bg-background p-1"
              />
              {swatches.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setColor(s)}
                  aria-label={`Pilih warna ${s}`}
                  className="size-7 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-110"
                  style={{ backgroundColor: s, ["--tw-ring-color" as string]: color === s ? s : "transparent" }}
                />
              ))}
            </div>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Komisi penjualan (%)"
              name="commissionPercent"
              state={state}
              hint="Bagian yang didapat agen dari penjualannya sendiri."
            >
              <Input
                id="commissionPercent"
                name="commissionPercent"
                type="number"
                min={0}
                max={100}
                step="0.01"
                defaultValue={level?.commissionPercent ?? "50"}
                required
                className="h-10"
              />
            </FormField>
            <FormField
              label="Bonus tim (%)"
              name="overridePercents"
              state={state}
              hint="Dari penjualan downline: tingkat 1, tingkat 2, ... Contoh: 10, 5"
            >
              <Input
                id="overridePercents"
                name="overridePercents"
                defaultValue={level?.overridePercents.join(", ") ?? ""}
                placeholder="10, 5"
                className="h-10"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Maks. downline langsung"
              name="maxDownlines"
              state={state}
              hint="Kosongkan untuk tanpa batas. 0 = tidak boleh merekrut."
            >
              <Input
                id="maxDownlines"
                name="maxDownlines"
                type="number"
                min={0}
                defaultValue={level?.maxDownlines ?? ""}
                placeholder="Tanpa batas"
                className="h-10"
              />
            </FormField>
            <FormField
              label="Level rekrutan"
              name="downlineLevelId"
              state={state}
              hint="Level otomatis untuk agen yang direkrut level ini."
            >
              <Select name="downlineLevelId" defaultValue={level?.downlineLevelId ?? "none"}>
                <SelectTrigger id="downlineLevelId" className="h-10 w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak bisa merekrut</SelectItem>
                  {options.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-xl border bg-muted/50 p-3.5">
            <span>
              <span className="block text-sm font-semibold text-navy">Level awal pendaftar baru</span>
              <span className="block text-xs text-muted-foreground">
                Dipakai untuk agen yang mendaftar tanpa sponsor (langsung di bawah Kerjalin).
              </span>
            </span>
            <Switch name="isDefault" defaultChecked={level?.isDefault} />
          </label>
        </>
      )}
    </FormDialog>
  );
}

export function DeleteLevelButton({ id, name, disabled }: { id: string; name: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const res = await deleteLevelAction(id);
    setBusy(false);
    if (res?.ok) toast.success(res.message);
    else toast.error(res?.error ?? "Gagal menghapus level");
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Hapus level ${name}`}>
          <Trash2 className="text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus level “{name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Level hanya bisa dihapus bila tidak ada agen yang memakainya. Tindakan ini tidak bisa dibatalkan.
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
