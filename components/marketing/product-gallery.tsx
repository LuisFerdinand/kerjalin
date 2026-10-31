"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Galeri produk: gambar besar dan deretan gambar kecil yang bisa dipilih dengan klik atau keyboard. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div
        className="grid aspect-[4/3] place-items-center rounded-2xl border border-border bg-muted text-faint"
        role="img"
        aria-label={`Belum ada gambar untuk ${name}`}
      >
        <ImageOff className="size-10" aria-hidden />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted shadow-card">
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === active ? `${name}, gambar ${i + 1} dari ${images.length}` : ""}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 600px, 100vw"
            className={cn("object-cover transition-opacity duration-300", i === active ? "opacity-100" : "opacity-0")}
          />
        ))}
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Tampilkan gambar ${i + 1}`}
                aria-pressed={i === active}
                className={cn(
                  "relative block aspect-[4/3] w-full overflow-hidden rounded-xl border-2 bg-muted transition-all focus-visible:ring-3 focus-visible:ring-navy/30",
                  i === active ? "border-navy" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
