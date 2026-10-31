import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { isGoogleConfigured } from "@/lib/config";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

function safeCallback(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard";
}

export default function LoginPage(props: PageProps<"/masuk">) {
  return (
    <>
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <Suspense fallback={<FormSkeleton />}>
        <LoginContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function RedirectIfSignedIn() {
  const session = await getSession();
  if (session) redirect(session.user.role === "super_admin" ? "/admin" : "/dashboard");
  return null;
}

async function LoginContent({ searchParams }: { searchParams: PageProps<"/masuk">["searchParams"] }) {
  const { callbackUrl } = await searchParams;
  return <LoginForm callbackUrl={safeCallback(callbackUrl)} googleEnabled={isGoogleConfigured()} />;
}

function FormSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
