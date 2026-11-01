import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppShell, ShellFallback } from "@/components/app/shell";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AccountMenu, AccountMenuSkeleton } from "@/components/app/user-menu";
import { getAdminCounts } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/session";
import { sidebarDefaultOpen } from "@/lib/sidebar-state";

export const metadata: Metadata = {
  title: { default: "Panel Admin", template: "%s | Admin Kerjalin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: ReactNode }) {
  const defaultOpen = await sidebarDefaultOpen();
  return (
    <AppShell
      variant="admin"
      defaultOpen={defaultOpen}
      sidebar={
        <Suspense fallback={<AppSidebar variant="admin" />}>
          <AdminSidebar />
        </Suspense>
      }
      account={
        <Suspense fallback={<AccountMenuSkeleton />}>
          <AdminAccount />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}

async function AdminSidebar() {
  await requireAdmin();
  const counts = await getAdminCounts();
  return <AppSidebar variant="admin" badges={counts} />;
}

async function AdminAccount() {
  const user = await requireAdmin();
  return <AccountMenu variant="admin" user={{ name: user.name, email: user.email, image: user.image ?? null, caption: "Super Admin" }} />;
}
