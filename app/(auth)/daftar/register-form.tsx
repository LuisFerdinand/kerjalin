"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SubmitButton, useActionForm } from "@/components/forms/action-form";
import { FormField, PasswordInput } from "@/components/forms/form-field";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { registerAction } from "../actions";

export function RegisterForm({
  defaultReferral,
  defaultName,
  sponsorName,
  googleEnabled,
}: {
  defaultReferral?: string;
  defaultName?: string;
  sponsorName?: string;
  googleEnabled: boolean;
}) {
  const { state, formProps, pending } = useActionForm(registerAction, { silent: true });

  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-bold text-navy">Daftar jadi agen Kerjalin</h1>
        <p className="text-muted-foreground">
          Gratis. Mulai jual layanan SaaS dan dapatkan komisi dari setiap langganan.
        </p>
      </div>

      {sponsorName && (
        <div className="flex items-start gap-3 rounded-xl bg-card p-4 text-[0.9375rem] text-navy">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-navy" />
          <p>
            Kamu diundang oleh <strong>{sponsorName}</strong>. Kamu akan otomatis bergabung di
            tim-nya.
          </p>
        </div>
      )}

      {googleEnabled && (
        <>
          <GoogleButton label="Daftar dengan Google" />
          <OrDivider />
        </>
      )}

      <form {...formProps} className="grid gap-4">
        <FormField label="Nama lengkap" name="name" state={state}>
          <Input id="name" name="name" defaultValue={defaultName} autoComplete="name" placeholder="Nama sesuai KTP" required className="h-11" />
        </FormField>
        <FormField label="Email" name="email" state={state}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="nama@email.com" required className="h-11" />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nomor WhatsApp" name="phone" state={state}>
            <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0812xxxxxxx" required className="h-11" />
          </FormField>
          <FormField label="Kota (opsional)" name="city" state={state}>
            <Input id="city" name="city" autoComplete="address-level2" placeholder="Jakarta" className="h-11" />
          </FormField>
        </div>
        <FormField label="Password" name="password" state={state} hint="Minimal 8 karakter.">
          <PasswordInput id="password" name="password" autoComplete="new-password" required className="h-11" />
        </FormField>
        <FormField label="Ulangi password" name="confirmPassword" state={state}>
          <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required className="h-11" />
        </FormField>
        <FormField
          label="Kode referral (opsional)"
          name="referral"
          state={state}
          hint="Isi bila kamu diajak oleh agen Kerjalin."
        >
          <Input
            id="referral"
            name="referral"
            defaultValue={defaultReferral}
            placeholder="KJXXXXXX"
            className="h-11 uppercase"
            autoCapitalize="characters"
          />
        </FormField>

        <div className="grid gap-1.5">
          <label className="flex items-start gap-2.5 text-[0.9375rem] text-muted-foreground">
            <Checkbox name="terms" id="terms" className="mt-0.5" />
            <span>
              Saya setuju dengan{" "}
              <Link href="/syarat-ketentuan" target="_blank" className="font-semibold text-navy underline underline-offset-2">
                syarat & ketentuan
              </Link>{" "}
              serta{" "}
              <Link href="/kebijakan-privasi" target="_blank" className="font-semibold text-navy underline underline-offset-2">
                kebijakan privasi
              </Link>{" "}
              Kerjalin, dan memahami bahwa penghasilan berasal dari penjualan layanan, bukan dari biaya
              pendaftaran.
            </span>
          </label>
          {state && !state.ok && state.fieldErrors?.terms && (
            <p role="alert" className="text-[0.9375rem] font-medium text-destructive">
              {state.fieldErrors.terms}
            </p>
          )}
        </div>

        {state && !state.ok && state.error && !state.fieldErrors && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-[0.9375rem] text-destructive">
            {state.error}
          </p>
        )}

        <SubmitButton pending={pending} size="lg" className="h-11 text-[0.9375rem] font-semibold" pendingText="Mendaftarkan...">
          Daftar Sekarang
        </SubmitButton>
      </form>

      <p className="text-center text-[0.9375rem] text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-navy underline underline-offset-2">
          Masuk
        </Link>
      </p>
    </div>
  );
}
