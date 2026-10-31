import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { REF_COOKIE } from "@/lib/config";
import { getAgentByUserId, requireUser } from "@/lib/session";
import { lookupSponsor } from "@/lib/queries/public";
import { CompleteProfileForm } from "./complete-form";

export const metadata: Metadata = { title: "Lengkapi Profil Agen" };

export default function CompleteProfilePage(props: PageProps<"/daftar/lengkapi">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Content searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/daftar/lengkapi">["searchParams"] }) {
  const user = await requireUser();
  if (user.role === "super_admin") redirect("/admin");
  if (await getAgentByUserId(user.id)) redirect("/dashboard");

  const { e } = await searchParams;
  const notice = Array.isArray(e) ? e[0] : e;
  const code = (await cookies()).get(REF_COOKIE)?.value?.toUpperCase();
  const sponsor = code ? await lookupSponsor(code) : null;

  return (
    <CompleteProfileForm
      name={user.name}
      notice={notice}
      defaultReferral={sponsor?.ok ? code : undefined}
      sponsorName={sponsor?.ok ? sponsor.name : undefined}
    />
  );
}
