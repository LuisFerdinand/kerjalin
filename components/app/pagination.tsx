import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageCount,
  total,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) {
    return <p className="px-1 text-sm text-muted-foreground">{total} data</p>;
  }

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Halaman {page} dari {pageCount} · {total} data
      </p>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" disabled={page <= 1} aria-disabled={page <= 1}>
          <Link href={href(Math.max(1, page - 1))} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
            <ChevronLeft /> Sebelumnya
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" aria-disabled={page >= pageCount}>
          <Link
            href={href(Math.min(pageCount, page + 1))}
            className={page >= pageCount ? "pointer-events-none opacity-50" : ""}
          >
            Berikutnya <ChevronRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
