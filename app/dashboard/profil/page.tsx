import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ProfileForm } from "@/components/agent/profile-form";
import { requireAgent } from "@/lib/session";

export const metadata: Metadata = { title: "Profil & Rekening" };

export default async function ProfilePage() {
  const { user, agent } = await requireAgent();
  const defaults = {
    name: user.name,
    email: user.email,
    phone: agent.phone ?? "",
    city: agent.city ?? "",
    bankName: agent.bankName ?? "",
    bankAccountNumber: agent.bankAccountNumber ?? "",
    bankAccountName: agent.bankAccountName ?? "",
  };
  return (
    <>
      <PageHeader title="Profil & Rekening" description="Perbarui data dirimu dan rekening tujuan pencairan komisi." />
      <div className="max-w-3xl">
        {/* key: form dibuat ulang saat data tersimpan agar nilai Select ikut diperbarui */}
        <ProfileForm key={JSON.stringify(defaults)} defaults={defaults} />
      </div>
    </>
  );
}
