import {
  Banknote,
  Boxes,
  Layers,
  LayoutDashboard,
  Network,
  Package,
  ReceiptText,
  Tags,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Kunci hitungan untuk antrean yang perlu ditindak. Nama antrean ada di `badgeLabel`. */
  badgeKey?: string;
  badgeLabel?: string;
  exact?: boolean;
};
export type NavGroup = { label: string; items: NavItem[] };
export type Variant = "admin" | "agent";

/** Menu sidebar. Dipakai juga oleh pencarian cepat di bilah atas. */
export const NAV: Record<Variant, NavGroup[]> = {
  admin: [
    {
      label: "Jaringan",
      items: [
        { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
        { href: "/admin/pohon", label: "Pohon jaringan", icon: Network },
        {
          href: "/admin/agen",
          label: "Agen",
          icon: Users,
          badgeKey: "pendingAgents",
          badgeLabel: "agen menunggu persetujuan",
        },
        { href: "/admin/level", label: "Level & komisi", icon: Layers },
      ],
    },
    {
      label: "Penjualan",
      items: [
        { href: "/admin/produk", label: "Produk", icon: Package },
        { href: "/admin/kategori", label: "Kategori", icon: Tags },
        {
          href: "/admin/pesanan",
          label: "Pesanan",
          icon: ReceiptText,
          badgeKey: "pendingOrders",
          badgeLabel: "pesanan belum lunas",
        },
        {
          href: "/admin/penarikan",
          label: "Penarikan",
          icon: Banknote,
          badgeKey: "pendingWithdrawals",
          badgeLabel: "penarikan perlu diproses",
        },
      ],
    },
  ],
  agent: [
    {
      label: "Ringkasan",
      items: [
        { href: "/dashboard", label: "Beranda", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/tim", label: "Tim saya", icon: Network },
        { href: "/dashboard/penjualan", label: "Penjualan", icon: ReceiptText },
      ],
    },
    {
      label: "Keuangan",
      items: [
        { href: "/dashboard/komisi", label: "Riwayat komisi", icon: Wallet },
        { href: "/dashboard/penarikan", label: "Penarikan", icon: Banknote },
      ],
    },
    {
      label: "Lainnya",
      items: [
        { href: "/dashboard/produk", label: "Katalog produk", icon: Boxes },
        { href: "/dashboard/profil", label: "Profil & rekening", icon: UserCog },
      ],
    },
  ],
};

export function isActive(item: NavItem, pathname: string | null) {
  if (pathname === null) return false;
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
