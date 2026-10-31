"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, PasswordInput } from "@/components/forms/form-field";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { authClient } from "@/lib/auth-client";

export function LoginForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      password: String(form.get("password") ?? ""),
    });
    if (error) {
      setLoading(false);
      const msg =
        error.status === 429
          ? "Terlalu banyak percobaan. Coba lagi sebentar lagi."
          : "Email atau password salah.";
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success("Berhasil masuk");
    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <h1 className="text-3xl font-extrabold text-navy">Selamat datang kembali</h1>
        <p className="text-muted-foreground">Masuk untuk membuka dashboard Kerjalin kamu.</p>
      </div>

      {googleEnabled && (
        <>
          <GoogleButton callbackURL={callbackUrl} label="Masuk dengan Google" />
          <OrDivider />
        </>
      )}

      <form onSubmit={onSubmit} className="grid gap-4">
        <FormField label="Email" name="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            required
            className="h-11"
          />
        </FormField>
        <FormField label="Password" name="password">
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Masukkan password"
            required
            className="h-11"
          />
        </FormField>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11 text-sm font-semibold" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          Masuk
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-semibold text-brand hover:underline">
          Daftar jadi agen
        </Link>
      </p>
    </div>
  );
}
