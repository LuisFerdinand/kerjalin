"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-7" />
      </span>
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Terjadi kesalahan</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Maaf, ada masalah saat memuat halaman ini. Coba lagi, atau kembali ke beranda.
          {error.digest && <span className="mt-1 block text-[0.9375rem]">Kode: {error.digest}</span>}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => retry()}>Coba lagi</Button>
        <Button asChild variant="outline">
          <Link href="/">Beranda</Link>
        </Button>
      </div>
    </div>
  );
}
