"use client";

import { Suspense, useLayoutEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { NAV, isActive, type NavItem, type Variant } from "./nav";
import { SignOutButton } from "./user-menu";

/** Ingat pilihan ciut/terbuka dari kunjungan sebelumnya (cookie ditulis oleh SidebarProvider). */
function SidebarMemory() {
  const { setOpen } = useSidebar();
  // Sebelum browser menggambar, supaya sidebar tidak sempat tampil terbuka lalu menciut.
  useLayoutEffect(() => {
    const saved = document.cookie.split("; ").find((c) => c.startsWith("sidebar_state="));
    if (saved?.endsWith("=false")) setOpen(false);
    // Hanya saat pertama dimuat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** Tombol untuk menciutkan dan membuka kembali sidebar. Di versi ciut, tombol ini berada di bawah logo. */
function CollapseToggle() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
      title={`${collapsed ? "Buka" : "Ciutkan"} sidebar (Ctrl+B)`}
      className="hidden size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white outline-none transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 md:grid"
    >
      <ChevronLeft className={cn("size-4 transition-transform duration-200", collapsed && "rotate-180")} aria-hidden />
    </button>
  );
}

function NavLink({ item, active, count }: { item: NavItem; active: boolean; count: number }) {
  const { isMobile, state, setOpenMobile } = useSidebar();
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={() => isMobile && setOpenMobile(false)}
            className={cn(
              "relative flex h-11 items-center gap-3 rounded-l-2xl pr-3 pl-4 text-[0.9375rem] font-medium text-sidebar-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/60",
              "hover:bg-white/10 hover:text-white",
              "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
              active && "nav-tab bg-white font-semibold text-navy hover:bg-white hover:text-navy",
            )}
          >
            <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.1 : 1.7} aria-hidden />
            <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
            {count > 0 && (
              <>
                <span
                  title={`${count} ${item.badgeLabel}`}
                  className={cn(
                    "relative z-10 ml-auto rounded-full px-2 py-0.5 text-xs font-bold tabular-nums group-data-[collapsible=icon]:hidden",
                    active ? "bg-navy text-white" : "bg-white text-navy",
                  )}
                >
                  <span className="sr-only">{item.badgeLabel}: </span>
                  {count}
                </span>
                {/* Titik di pojok kanan atas ikon (bukan di atasnya). Cincinnya mengikuti warna latar tab. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[7px] left-1/2 z-10 ml-[3px] hidden size-2.5 rounded-full bg-rose-400 ring-2 group-data-[collapsible=icon]:block",
                    active ? "ring-white" : "ring-sidebar",
                  )}
                />
              </>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
          {item.label}
          {count > 0 ? ` · ${count}` : ""}
        </TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  );
}

function NavGroups({ variant, badges, pathname }: { variant: Variant; badges: Record<string, number>; pathname: string | null }) {
  return (
    <>
      {NAV[variant].map((group) => (
        <SidebarGroup key={group.label} className="py-2 pr-0 pl-3 group-data-[collapsible=icon]:pl-2">
          <SidebarGroupLabel className="h-6 px-2 text-[0.6875rem] font-semibold tracking-[0.08em] text-white/45 uppercase">
            {group.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item, pathname)} count={item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

/** usePathname() hanya tersedia saat runtime, jadi dibungkus Suspense agar shell tetap bisa di-prerender. */
function ActiveNavGroups(props: { variant: Variant; badges: Record<string, number> }) {
  const pathname = usePathname();
  return <NavGroups {...props} pathname={pathname} />;
}

export function AppSidebar({ variant, badges = {} }: { variant: Variant; badges?: Record<string, number> }) {
  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="z-30! border-r-0! [&_[data-sidebar=sidebar]]:bg-[linear-gradient(180deg,#0c2f7a_0%,#082052_42%,#061a45_100%)]"
    >
      <SidebarMemory />

      {/* Saat diciutkan, header dan footer memakai jarak yang sama dengan daftar menu (8px kiri, 0 kanan) supaya ikon sejajar. */}
      <SidebarHeader className="px-5 pt-5 pb-2 group-data-[collapsible=icon]:pr-0 group-data-[collapsible=icon]:pl-2">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-3">
          <Link
            href={variant === "admin" ? "/admin" : "/dashboard"}
            aria-label="Kerjalin"
            className="flex items-center gap-2.5 overflow-hidden group-data-[collapsible=icon]:justify-center"
          >
            <Logo
              tone="light"
              markClassName="size-9 group-data-[collapsible=icon]:size-8"
              className="[&>span:last-child]:group-data-[collapsible=icon]:hidden"
            />
          </Link>
          <CollapseToggle />
        </div>
      </SidebarHeader>

      {/* Saat diciutkan, isi dipotong di tepinya; ruang di atas menampung lengkung tab bila menu pertama aktif. */}
      <SidebarContent className="mt-2 gap-0 overflow-x-hidden group-data-[collapsible=icon]:pt-8">
        <Suspense fallback={<NavGroups variant={variant} badges={badges} pathname={null} />}>
          <ActiveNavGroups variant={variant} badges={badges} />
        </Suspense>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-3 group-data-[collapsible=icon]:pr-0 group-data-[collapsible=icon]:pl-2">
        <SignOutButton />
      </SidebarFooter>
    </Sidebar>
  );
}
