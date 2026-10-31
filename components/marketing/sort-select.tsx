"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

/** Pilihan urutan. Tiap opsi membawa URL lengkap sehingga filter lain tetap terjaga. */
export function SortSelect({ value, options }: { value: string; options: { value: string; label: string; href: string }[] }) {
  const router = useRouter();
  return (
    <label className="relative inline-flex items-center gap-3 text-sm text-muted-foreground">
      <span className="hidden sm:inline">Urutkan</span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => {
            const next = options.find((o) => o.value === e.target.value);
            if (next) router.push(next.href);
          }}
          className="h-11 min-w-[180px] cursor-pointer appearance-none rounded-xl border border-input bg-white pr-10 pl-4 text-sm font-semibold text-navy outline-none transition-colors hover:border-navy focus-visible:border-navy focus-visible:ring-3 focus-visible:ring-navy/20"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-navy" aria-hidden />
      </span>
    </label>
  );
}
