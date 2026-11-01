import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppShell, ShellFallback } from "@/components/app/shell";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AccountMenu, AccountMenuSkeleton } from "@/components/app/user-menu";
import { requireAgent } from "@/lib/session";
import { sidebarDefaultOpen } from "@/lib/sidebar-state";

export const metadata: Metadata = {
  title: { default: "Dashboard Agen", template: "%s | Kerjalin" },
  robots: { index: false, follow: false },
};

export default function AgentLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AgentShell>{children}</AgentShell>
    </Suspense>
  );
}

async function AgentShell({ children }: { children: ReactNode }) {
  const defaultOpen = await sidebarDefaultOpen();
  return (
    <AppShell
      variant="agent"
      defaultOpen={defaultOpen}
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
