"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/lib/cloudinary-upload";

/**
 * Unggah gambar ke Cloudinary (signed upload) dan simpan URL-nya di input tersembunyi `name`.
 * Admin juga bisa menempel URL Cloudinary / path lokal (/images/...) secara manual.
 */
export function ImageUploader({
  name,
  defaultValue = "",
  label = "Gambar",
}: {
  name: string;
  defaultValue?: string | null;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    try {
      setUrl(await uploadImage(file));
      toast.success("Gambar berhasil diunggah");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload gagal.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="grid gap-2.5">
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-3">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- pratinjau URL bebas di form admin
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-faint" />
          )}
        </div>
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
              {busy ? "Mengunggah..." : url ? "Ganti gambar" : `Unggah ${label.toLowerCase()}`}
            </Button>
            {url && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setUrl("")}>
                <X /> Hapus
              </Button>
            )}
          </div>
          <p className="text-[0.8125rem] text-muted-foreground">JPG, PNG, atau WebP. Maksimal 5 MB.</p>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label={`Pilih berkas ${label.toLowerCase()}`}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
      </div>
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="atau tempel URL gambar (https://res.cloudinary.com/... atau /images/...)"
        className="h-9 text-[0.8125rem]"
        aria-label={`URL ${label}`}
      />
    </div>
  );
}
