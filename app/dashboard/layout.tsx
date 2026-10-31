import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app/shell";
import { AppSidebar } from "@/components/app/app-sidebar";
import { requireAgent } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Dashboard Agen", template: "%s | Kerjalin" },
  robots: { index: false, follow: false },
};

export default function AgentLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <AppShell
      variant="agent"
      sidebar={
        <Suspense fallback={<AppSidebar variant="agent" user={null} />}>
          <AgentSidebar />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}

async function AgentSidebar() {
  const { user, level } = await requireAgent();
  return (
    <AppSidebar
      variant="agent"
      user={{ name: user.name, email: user.email, image: user.image ?? null, caption: level.name }}
    />
  );
}
