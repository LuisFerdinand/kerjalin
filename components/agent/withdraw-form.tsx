"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton, useActionForm } from "@/components/forms/action-form";
import { FormField } from "@/components/forms/form-field";
import { Panel } from "@/components/app/page-header";
import { requestWithdrawalAction } from "@/app/dashboard/actions";
import { formatIDR } from "@/lib/format";

export function WithdrawForm({
  balance,
  min,
  hasBank,
  bankLabel,
  disabledReason,
}: {
  balance: number;
  min: number;
  hasBank: boolean;
  bankLabel?: string;
  disabledReason?: string;
}) {
  const [amount, setAmount] = useState("");
  const { state, formProps, pending } = useActionForm(requestWithdrawalAction, {
    onSuccess: () => setAmount(""),
  });

  const blocked = Boolean(disabledReason) || !hasBank || balance < min;

  return (
    <Panel
      title="Ajukan penarikan"
      description={`Diproses manual oleh tim Kerjalin ke rekeningmu. Minimal ${formatIDR(min)}.`}
    >
      <div className="grid gap-5">
        <div className="flex items-baseline justify-between rounded-lg bg-muted/60 px-4 py-3">
          <span className="text-sm text-muted-foreground">Saldo tersedia</span>
          <span className="text-[1.5rem] font-semibold tabular-nums text-navy">{formatIDR(balance)}</span>
        </div>

        {hasBank ? (
          <div className="flex items-start justify-between gap-3 text-[0.9375rem]">
            <div>
              <p className="text-[0.8125rem] text-muted-foreground">Dikirim ke</p>
              <p className="font-medium text-navy">{bankLabel}</p>
            </div>
            <Button asChild variant="link" size="sm" className="h-auto p-0 text-navy">
              <Link href="/dashboard/profil">Ubah</Link>
            </Button>
          </div>
        ) : (
          <p className="rounded-lg bg-[#fff4d6] px-4 py-3 text-sm text-[#7a4a00]">
            Lengkapi data rekening dulu di{" "}
            <Link href="/dashboard/profil" className="font-semibold underline">
              Profil & rekening
            </Link>
            .
          </p>
        )}

        <form {...formProps} className="grid gap-4">
          <FormField label="Jumlah penarikan (Rp)" name="amount" state={state}>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="numeric"
              min={min}
              max={Math.max(balance, 0)}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min. ${min.toLocaleString("id-ID")}`}
              disabled={blocked}
              className="h-11 text-base tabular-nums"
            />
          </FormField>
          <div className="flex flex-wrap gap-2">
            {[50_000, 100_000, 250_000].map((v) => (
              <Button key={v} type="button" variant="outline" size="sm" disabled={blocked || v > balance} onClick={() => setAmount(String(v))}>
                {formatIDR(v)}
              </Button>
            ))}
            <Button type="button" variant="outline" size="sm" disabled={blocked} onClick={() => setAmount(String(balance))}>
              Semua saldo
            </Button>
          </div>
          {disabledReason && <p className="text-sm text-negative">{disabledReason}</p>}
          {!disabledReason && hasBank && balance < min && (
            <p className="text-sm text-muted-foreground">Saldo belum mencapai minimal penarikan.</p>
          )}
          <SubmitButton pending={pending} size="lg" disabled={blocked} pendingText="Mengirim...">
            Ajukan penarikan
          </SubmitButton>
        </form>
      </div>
    </Panel>
  );
}
