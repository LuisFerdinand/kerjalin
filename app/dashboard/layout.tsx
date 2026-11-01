import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app/shell";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AccountMenu, AccountMenuSkeleton } from "@/components/app/user-menu";
import { requireAgent } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Dashboard Agen", template: "%s | Kerjalin" },
  robots: { index: false, follow: false },
};

export default function AgentLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <AppShell
      variant="agent"
      sidebar={<AppSidebar variant="agent" />}
      account={
        <Suspense fallback={<AccountMenuSkeleton />}>
          <AgentAccount />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}

async function AgentAccount() {
  const { user, level } = await requireAgent();
  return <AccountMenu variant="agent" user={{ name: user.name, email: user.email, image: user.image ?? null, caption: level.name }} />;
}
