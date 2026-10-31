import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageCount,
  total,
  basePath,
  params,
  pageKey = "page",
  noun = "data",
}: {
  page: number;
  pageCount: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
  /** Nama parameter URL untuk halaman. */
  pageKey?: string;
  noun?: string;
}) {
  if (pageCount <= 1) {
    return <p className="text-[0.8125rem] text-muted-foreground">{total} {noun}</p>;
  }

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set(pageKey, String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-[0.8125rem] text-muted-foreground">
        Halaman {page} dari {pageCount} · {total} {noun}
      </p>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" aria-disabled={page <= 1}>
          <Link href={href(Math.max(1, page - 1))} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
            <ChevronLeft /> Sebelumnya
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" aria-disabled={page >= pageCount}>
          <Link href={href(Math.min(pageCount, page + 1))} className={page >= pageCount ? "pointer-events-none opacity-50" : ""}>
            Berikutnya <ChevronRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
