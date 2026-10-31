import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app/shell";
import { AppSidebar } from "@/components/app/app-sidebar";
import { getAdminCounts } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Panel Admin", template: "%s | Admin Kerjalin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AppShell
      title="Panel Admin"
      sidebar={
        <Suspense fallback={<AppSidebar variant="admin" user={null} />}>
          <AdminSidebar />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}

async function AdminSidebar() {
  const user = await requireAdmin();
  const counts = await getAdminCounts();
  return (
    <AppSidebar
      variant="admin"
      badges={counts}
      user={{ name: user.name, email: user.email, image: user.image ?? null, caption: "Super Admin" }}
    />
  );
}
