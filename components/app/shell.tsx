import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function AppShell({
  title,
  sidebar,
  children,
}: {
  title: string;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset className="min-w-0 bg-muted/40">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-semibold text-navy">{title}</span>
        </header>
        <div className="mx-auto w-full max-w-[1400px] flex-1 p-4 md:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function PageSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Memuat">
      <div className="grid gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
