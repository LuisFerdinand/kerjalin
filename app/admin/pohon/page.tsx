import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { NetworkTree } from "@/components/admin/network-tree";
import { getTreeNodes, listLevelOptions } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Pohon Jaringan" };

export default async function NetworkPage() {
  await requireAdmin();
  const [nodes, levels] = await Promise.all([getTreeNodes(), listLevelOptions()]);

  return (
    <>
      <PageHeader
        title="Pohon Jaringan"
        description="Lihat struktur agen dan upline-downline-nya. Pilih agen untuk mengubah level, slot downline, atau memindahkannya."
      />
      <NetworkTree nodes={nodes} levels={levels} />
    </>
  );
}
