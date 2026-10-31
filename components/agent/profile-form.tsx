"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton, useActionForm } from "@/components/forms/action-form";
import { FormField } from "@/components/forms/form-field";
import { updateProfileAction } from "@/app/dashboard/actions";

const BANKS = ["BCA", "BRI", "BNI", "Mandiri", "BSI", "CIMB Niaga", "Permata", "Danamon", "BTN", "Bank Jago", "SeaBank", "Jenius (BTPN)", "Bank Lainnya"];
const EWALLETS = ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"];

export function ProfileForm({
  defaults,
}: {
  defaults: {
    name: string;
    email: string;
    phone: string;
    city: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
  };
}) {
  const { state, formProps, pending } = useActionForm(updateProfileAction);

  return (
    <form {...formProps} className="grid gap-6">
      <Card className="gap-5 p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-navy">Data diri</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nama lengkap" name="name" state={state}>
            <Input id="name" name="name" defaultValue={defaults.name} required className="h-10" />
          </FormField>
          <FormField label="Email" name="email">
            <Input id="email" value={defaults.email} disabled className="h-10" readOnly />
          </FormField>
          <FormField label="Nomor WhatsApp" name="phone" state={state}>
            <Input id="phone" name="phone" type="tel" defaultValue={defaults.phone} required className="h-10" />
          </FormField>
          <FormField label="Kota" name="city" state={state}>
            <Input id="city" name="city" defaultValue={defaults.city} className="h-10" />
          </FormField>
        </div>
      </Card>

      <Card className="gap-5 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-extrabold text-navy">Rekening pencairan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Komisi akan ditransfer ke rekening ini. Pastikan nama pemilik sesuai dengan data bank.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Bank / e-wallet" name="bankName" state={state}>
            <Select name="bankName" defaultValue={defaults.bankName || undefined}>
              <SelectTrigger id="bankName" className="h-10 w-full bg-background">
                <SelectValue placeholder="Pilih bank atau e-wallet" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Bank</SelectLabel>
                  {BANKS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>E-wallet</SelectLabel>
                  {EWALLETS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Nomor rekening / e-wallet" name="bankAccountNumber" state={state}>
            <Input
              id="bankAccountNumber"
              name="bankAccountNumber"
              inputMode="numeric"
              defaultValue={defaults.bankAccountNumber}
              required
              className="h-10"
            />
          </FormField>
          <FormField label="Nama pemilik rekening" name="bankAccountName" state={state} className="sm:col-span-2">
            <Input id="bankAccountName" name="bankAccountName" defaultValue={defaults.bankAccountName} required className="h-10 uppercase" />
          </FormField>
        </div>
      </Card>

      <div className="flex justify-end">
        <SubmitButton pending={pending} size="lg" className="h-11 px-8 font-semibold" pendingText="Menyimpan...">
          Simpan perubahan
        </SubmitButton>
      </div>
    </form>
  );
}
