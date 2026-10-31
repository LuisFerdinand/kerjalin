"use client";

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
import { Panel } from "@/components/app/page-header";
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
      <Panel title="Data diri">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nama lengkap" name="name" state={state}>
            <Input id="name" name="name" defaultValue={defaults.name} required />
          </FormField>
          <FormField label="Email" name="email" hint="Email tidak bisa diubah di sini.">
            <Input id="email" value={defaults.email} disabled readOnly />
          </FormField>
          <FormField label="Nomor WhatsApp" name="phone" state={state}>
            <Input id="phone" name="phone" type="tel" defaultValue={defaults.phone} required />
          </FormField>
          <FormField label="Kota" name="city" state={state}>
            <Input id="city" name="city" defaultValue={defaults.city} />
          </FormField>
        </div>
      </Panel>

      <Panel title="Rekening pencairan" description="Komisi ditransfer ke rekening ini. Pastikan nama pemilik sesuai data bank.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Bank atau e-wallet" name="bankName" state={state}>
            <Select name="bankName" defaultValue={defaults.bankName || undefined}>
              <SelectTrigger id="bankName" className="w-full">
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
          <FormField label="Nomor rekening atau e-wallet" name="bankAccountNumber" state={state}>
            <Input
              id="bankAccountNumber"
              name="bankAccountNumber"
              inputMode="numeric"
              defaultValue={defaults.bankAccountNumber}
              required
              className="tabular-nums"
            />
          </FormField>
          <FormField label="Nama pemilik rekening" name="bankAccountName" state={state} className="sm:col-span-2">
            <Input id="bankAccountName" name="bankAccountName" defaultValue={defaults.bankAccountName} required className="uppercase" />
          </FormField>
        </div>
      </Panel>

      <div className="flex justify-end">
        <SubmitButton pending={pending} size="lg" className="px-8" pendingText="Menyimpan...">
          Simpan perubahan
        </SubmitButton>
      </div>
    </form>
  );
}
