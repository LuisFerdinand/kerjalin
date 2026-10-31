import Link from "next/link";
import { cn } from "@/lib/utils";

export type TabLink = { label: string; href: string; active: boolean; count?: number };

/** Tab garis bawah untuk status daftar. Aktif ditandai garis 2px, tanpa isian. */
export function TabsNav({ items, label }: { items: TabLink[]; label: string }) {
  return (
    <nav aria-label={label} className="flex gap-6 overflow-x-auto shadow-[inset_0_-1px_0_var(--border)]">
      {items.map((t) => (
        <Link
          key={t.label}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-2 border-b-2 border-transparent pt-1 pb-3 text-[0.9375rem] font-medium text-muted-foreground transition-colors hover:text-navy",
            t.active && "border-navy font-semibold text-navy",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="text-[0.8125rem] font-normal tabular-nums text-faint">{t.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
