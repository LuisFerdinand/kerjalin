"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_BYTES = 5 * 1024 * 1024;

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
    if (!file.type.startsWith("image/")) return toast.error("File harus berupa gambar.");
    if (file.size > MAX_BYTES) return toast.error("Ukuran gambar maksimal 5 MB.");

    setBusy(true);
    try {
      const signRes = await fetch("/api/upload/sign", { method: "POST" });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error ?? "Gagal menyiapkan upload.");

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", sign.apiKey);
      body.append("timestamp", String(sign.timestamp));
      body.append("folder", sign.folder);
      body.append("signature", sign.signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Upload ke Cloudinary gagal.");
      setUrl(data.secure_url);
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
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- pratinjau URL bebas di form admin
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
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
          <p className="text-xs text-muted-foreground">JPG, PNG, atau WebP. Maksimal 5 MB.</p>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
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
        className="h-9 text-xs"
        aria-label={`URL ${label}`}
      />
    </div>
  );
}
