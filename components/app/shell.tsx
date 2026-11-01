import type { CSSProperties, ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { AppTopbar } from "./topbar";

/**
 * Lebar sidebar saat diciutkan. Harus muat untuk tab aktif: lengkung kiri 16px + dua lengkung penyambung 32px,
 * ditambah jarak 8px dari tepi kiri. Lebih sempit dari ini, lengkung saling menimpa dan tab terlihat terpotong.
 */
const RAIL_WIDTH = "4rem";

/**
 * Sidebar navy di kiri, isi halaman putih di kanan. Menu aktif berupa tab putih yang menyatu dengan isi.
 * Sidebar bisa diciutkan menjadi deretan ikon (tombol di tepinya, atau Ctrl+B). Menu akun ada di ujung kanan bilah atas.
 */
export function AppShell({
  variant,
  defaultOpen,
  sidebar,
  account,
  children,
}: {
  variant: "admin" | "agent";
  /** Sidebar terbuka atau ciut saat pertama digambar (dari cookie, dibaca di server). */
  defaultOpen: boolean;
  sidebar: ReactNode;
  account: ReactNode;
  children: ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={defaultOpen} className="bg-white" style={{ "--sidebar-width-icon": RAIL_WIDTH } as CSSProperties}>
      {sidebar}
      <div className="flex min-h-svh min-w-0 flex-1 flex-col bg-white">
        <AppTopbar variant={variant} account={account} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}

/** Tampil sekejap selagi layout membaca cookie sidebar. Hanya kerangka: bilah navy di kiri dan bilah atas. */
export function ShellFallback() {
  return (
    <div className="flex min-h-svh bg-white" aria-busy="true" aria-label="Memuat">
      <div className="hidden w-60 shrink-0 bg-[#082052] md:block" />
      <div className="min-w-0 flex-1">
        <div className="h-16 border-b border-border" />
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageSkeleton />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Memuat">
      <div className="grid gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
