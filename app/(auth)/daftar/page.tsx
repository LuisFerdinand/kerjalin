import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Skeleton } from "@/components/ui/skeleton";
import { REF_COOKIE, isGoogleConfigured } from "@/lib/config";
import { lookupSponsor } from "@/lib/queries/public";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Daftar Agen",
  description: "Daftar gratis jadi agen Kerjalin dan dapatkan komisi dari setiap langganan layanan SaaS.",
};

export default function RegisterPage(props: PageProps<"/daftar">) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <RegisterContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function RegisterContent({ searchParams }: { searchParams: PageProps<"/daftar">["searchParams"] }) {
  const { ref, nama } = await searchParams;
  const fromQuery = Array.isArray(ref) ? ref[0] : ref;
  const fromCookie = (await cookies()).get(REF_COOKIE)?.value;
  const code = (fromQuery ?? fromCookie)?.trim().toUpperCase();
  const sponsor = code ? await lookupSponsor(code) : null;

  return (
    <RegisterForm
      defaultReferral={code}
      defaultName={Array.isArray(nama) ? nama[0] : nama}
      sponsorName={sponsor?.ok ? sponsor.name : undefined}
      googleEnabled={isGoogleConfigured()}
    />
  );
}

function FormSkeleton() {
  return (
    <div className="grid gap-5">
      <Skeleton className="h-10 w-3/4" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}
