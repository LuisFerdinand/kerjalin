"use client";

import { BadgeCheck, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SubmitButton, useActionForm } from "@/components/forms/action-form";
import { FormField } from "@/components/forms/form-field";
import { completeProfileAction } from "../../actions";

export function CompleteProfileForm({
  name,
  notice,
  defaultReferral,
  sponsorName,
}: {
  name: string;
  notice?: string;
  defaultReferral?: string;
  sponsorName?: string;
}) {
  const { state, formProps, pending } = useActionForm(completeProfileAction, { silent: true });

  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-bold text-navy">Satu langkah lagi, {name.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">
          Lengkapi data berikut agar akun agen kamu bisa kami proses.
        </p>
      </div>

      {notice && (
        <div className="flex items-start gap-3 rounded-xl bg-[#fff4d6] p-4 text-[0.9375rem] text-[#7a4a00]">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <p>{notice} Kamu bisa mengosongkan kode referral untuk bergabung langsung di bawah Kerjalin.</p>
        </div>
      )}
      {sponsorName && (
        <div className="flex items-start gap-3 rounded-xl bg-card p-4 text-[0.9375rem] text-navy">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-navy" />
          <p>
            Kamu diundang oleh <strong>{sponsorName}</strong>.
          </p>
        </div>
      )}

      <form {...formProps} className="grid gap-4">
        <FormField label="Nomor WhatsApp" name="phone" state={state}>
          <Input id="phone" name="phone" type="tel" inputMode="tel" placeholder="0812xxxxxxx" required className="h-11" />
        </FormField>
        <FormField label="Kota (opsional)" name="city" state={state}>
          <Input id="city" name="city" placeholder="Jakarta" className="h-11" />
        </FormField>
        <FormField
          label="Kode referral (opsional)"
          name="referral"
          state={state}
          hint="Isi bila kamu diajak oleh agen Kerjalin."
        >
          <Input id="referral" name="referral" defaultValue={defaultReferral} placeholder="KJXXXXXX" className="h-11 uppercase" />
        </FormField>

        {state && !state.ok && state.error && !state.fieldErrors && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-[0.9375rem] text-destructive">
            {state.error}
          </p>
        )}

        <SubmitButton pending={pending} size="lg" className="h-11 text-[0.9375rem] font-semibold" pendingText="Menyimpan...">
          Selesaikan Pendaftaran
        </SubmitButton>
      </form>
    </div>
  );
}
