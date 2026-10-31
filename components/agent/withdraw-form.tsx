"use client";

import { useState } from "react";
import Link from "next/link";
import { Banknote, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton, useActionForm } from "@/components/forms/action-form";
import { FormField } from "@/components/forms/form-field";
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
    <Card className="gap-5 p-5 sm:p-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy">
          <Banknote className="size-5 text-brand" /> Tarik dana
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pencairan diproses manual oleh tim Kerjalin ke rekening kamu. Minimal penarikan {formatIDR(min)}.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3">
        <span className="text-sm text-muted-foreground">Saldo tersedia</span>
        <span className="text-xl font-extrabold text-navy tabular-nums">{formatIDR(balance)}</span>
      </div>

      {hasBank ? (
        <div className="flex items-start gap-3 rounded-xl border p-3.5 text-sm">
          <Landmark className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Dikirim ke</p>
            <p className="font-semibold text-navy">{bankLabel}</p>
          </div>
          <Button asChild variant="link" size="sm" className="ml-auto h-auto p-0">
            <Link href="/dashboard/profil">Ubah</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-sm text-navy">
          Lengkapi data rekening bank dulu di{" "}
          <Link href="/dashboard/profil" className="font-bold text-brand underline">
            Profil & Rekening
          </Link>
          .
        </div>
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
            className="h-11 text-base"
          />
        </FormField>
        <div className="flex flex-wrap gap-2">
          {[50_000, 100_000, 250_000].map((v) => (
            <Button
              key={v}
              type="button"
              variant="outline"
              size="sm"
              disabled={blocked || v > balance}
              onClick={() => setAmount(String(v))}
            >
              {formatIDR(v)}
            </Button>
          ))}
          <Button type="button" variant="outline" size="sm" disabled={blocked} onClick={() => setAmount(String(balance))}>
            Semua saldo
          </Button>
        </div>
        {disabledReason && <p className="text-sm text-destructive">{disabledReason}</p>}
        {!disabledReason && hasBank && balance < min && (
          <p className="text-sm text-muted-foreground">Saldo belum mencapai minimal penarikan.</p>
        )}
        <SubmitButton pending={pending} size="lg" className="h-11 font-semibold" disabled={blocked} pendingText="Mengirim...">
          Ajukan penarikan
        </SubmitButton>
      </form>
    </Card>
  );
}
