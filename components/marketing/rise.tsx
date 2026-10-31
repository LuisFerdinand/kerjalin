import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Muncul saat halaman dimuat, murni CSS tanpa JavaScript.
 * Untuk bagian atas halaman; yang di bawah layar memakai `Reveal`. `delay` dalam detik.
 */
export function Rise({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("rise", className)}
      style={{ ["--rise-delay" as string]: `${delay}s`, ["--rise-y" as string]: `${y}px` }}
    >
      {children}
    </div>
  );
}
