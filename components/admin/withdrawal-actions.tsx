"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "@/components/forms/form-dialog";
import { FormField } from "@/components/forms/form-field";
import { ImageUploader } from "@/components/forms/image-uploader";
import { processWithdrawalAction } from "@/app/admin/penarikan/actions";
import { formatIDR } from "@/lib/format";

type Props = {
  id: string;
  name: string;
  amount: number;
  bank: string;
};

export function WithdrawalActions({ id, name, amount, bank }: Props) {
  return (
    <div className="flex justify-end gap-2">
      <FormDialog
        title="Tandai sudah dibayar"
        description={
          <>
            Setelah kamu mentransfer <strong>{formatIDR(amount)}</strong> ke {name} ({bank}), unggah bukti transfer
            agar agen bisa melihatnya.
          </>
        }
        action={processWithdrawalAction}
        submitLabel="Konfirmasi pembayaran"
        trigger={
          <Button size="sm">
            <CheckCircle2 /> Bayar
          </Button>
        }
      >
        {(state) => (
          <>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="action" value="paid" />
            <FormField label="Bukti transfer (opsional)" name="proofUrl" state={state}>
              <ImageUploader name="proofUrl" label="Bukti transfer" />
            </FormField>
            <FormField label="Catatan untuk agen (opsional)" name="note" state={state}>
              <Textarea id="note" name="note" rows={2} />
            </FormField>
          </>
        )}
      </FormDialog>

      <FormDialog
        title="Tolak penarikan"
        description={`Saldo ${formatIDR(amount)} akan dikembalikan ke dompet ${name}.`}
        action={processWithdrawalAction}
        submitLabel="Tolak penarikan"
        destructive
        size="sm"
        trigger={
          <Button size="sm" variant="outline">
            <XCircle className="text-destructive" /> Tolak
          </Button>
        }
      >
        {(state) => (
          <>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="action" value="rejected" />
            <FormField label="Alasan penolakan" name="note" state={state}>
              <Textarea id="note" name="note" rows={3} placeholder="mis. Nomor rekening tidak valid" required />
            </FormField>
          </>
        )}
      </FormDialog>
    </div>
  );
}
