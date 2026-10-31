"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Boxes,
  Layers,
  LayoutDashboard,
  Network,
  Package,
  ReceiptText,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/logo";
import { UserMenu, type UserMenuUser } from "./user-menu";

type NavItem = { href: string; label: string; icon: LucideIcon; badgeKey?: string; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const NAV: Record<"admin" | "agent", NavGroup[]> = {
  admin: [
    {
      label: "Utama",
      items: [
        { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
        { href: "/admin/pohon", label: "Pohon Jaringan", icon: Network },
        { href: "/admin/agen", label: "Agen", icon: Users, badgeKey: "pendingAgents" },
        { href: "/admin/level", label: "Level & Komisi", icon: Layers },
      ],
    },
    {
      label: "Penjualan",
      items: [
        { href: "/admin/produk", label: "Produk", icon: Package },
        { href: "/admin/pesanan", label: "Pesanan", icon: ReceiptText, badgeKey: "pendingOrders" },
        { href: "/admin/penarikan", label: "Penarikan", icon: Banknote, badgeKey: "pendingWithdrawals" },
      ],
    },
  ],
  agent: [
    {
      label: "Utama",
      items: [
        { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/tim", label: "Tim Saya", icon: Network },
        { href: "/dashboard/penjualan", label: "Penjualan", icon: ReceiptText },
      ],
    },
    {
      label: "Keuangan",
      items: [
        { href: "/dashboard/komisi", label: "Riwayat Komisi", icon: Wallet },
        { href: "/dashboard/penarikan", label: "Penarikan", icon: Banknote },
      ],
    },
    {
      label: "Lainnya",
      items: [
        { href: "/dashboard/produk", label: "Katalog Produk", icon: Boxes },
        { href: "/dashboard/profil", label: "Profil & Rekening", icon: UserCog },
      ],
    },
  ],
};

function NavGroups({
  variant,
  badges,
  pathname,
}: {
  variant: "admin" | "agent";
  badges: Record<string, number>;
  pathname: string | null;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <>
      {NAV[variant].map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const active =
                  pathname !== null &&
                  (item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`));
                const count = item.badgeKey ? badges[item.badgeKey] : 0;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className="h-10 data-[active=true]:bg-brand data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-brand/30"
                    >
                      <Link href={item.href} onClick={() => isMobile && setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {count > 0 && (
                      <SidebarMenuBadge className="bg-warning text-[0.65rem] font-bold text-white">
                        {count}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

/** usePathname() hanya tersedia saat runtime, jadi dibungkus Suspense agar shell tetap bisa di-prerender. */
function ActiveNavGroups(props: { variant: "admin" | "agent"; badges: Record<string, number> }) {
  const pathname = usePathname();
  return <NavGroups {...props} pathname={pathname} />;
}

export function AppSidebar({
  variant,
  user,
  badges = {},
}: {
  variant: "admin" | "agent";
  user: UserMenuUser | null;
  badges?: Record<string, number>;
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link
          href={variant === "admin" ? "/admin" : "/dashboard"}
          aria-label="Kerjalin"
          className="flex items-center gap-2.5 overflow-hidden px-1 group-data-[collapsible=icon]:px-0"
        >
          <Logo tone="light" markClassName="size-8" className="[&>span:last-child]:group-data-[collapsible=icon]:hidden" />
        </Link>
        <p className="px-1 text-[0.65rem] font-semibold tracking-[0.2em] text-cream/50 uppercase group-data-[collapsible=icon]:hidden">
          {variant === "admin" ? "Panel Admin" : "Portal Agen"}
        </p>
      </SidebarHeader>

      <SidebarContent>
        <Suspense fallback={<NavGroups variant={variant} badges={badges} pathname={null} />}>
          <ActiveNavGroups variant={variant} badges={badges} />
        </Suspense>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <UserMenu user={user} variant={variant} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
