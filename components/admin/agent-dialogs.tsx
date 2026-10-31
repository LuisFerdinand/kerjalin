"use client";

import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "@/components/forms/form-dialog";
import { FormField, PasswordInput } from "@/components/forms/form-field";
import { AgentCombobox } from "@/components/admin/agent-combobox";
import type { TreeNodeData } from "@/lib/queries/admin";
import type { AgentStatus } from "@/db/schema";
import {
  adjustWalletAction,
  createAgentAction,
  moveAgentAction,
  setAgentStatusAction,
  updateAgentAction,
} from "@/app/admin/agen/actions";

export type LevelOption = { id: string; name: string; color: string };

export function LevelSelect({
  name,
  levels,
  defaultValue,
  withAuto,
}: {
  name: string;
  levels: LevelOption[];
  defaultValue?: string;
  withAuto?: boolean;
}) {
  return (
    <Select name={name} defaultValue={defaultValue ?? (withAuto ? "auto" : levels[0]?.id)}>
      <SelectTrigger id={name} className="h-10 w-full bg-background">
        <SelectValue placeholder="Pilih level" />
      </SelectTrigger>
      <SelectContent>
        {withAuto && <SelectItem value="auto">Otomatis (sesuai level sponsor)</SelectItem>}
        {levels.map((l) => (
          <SelectItem key={l.id} value={l.id}>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} />
              {l.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* -------------------------------------------------------------------------- */

export function AddAgentDialog({
  nodes,
  levels,
  defaultParentId,
  trigger,
}: {
  nodes: TreeNodeData[];
  levels: LevelOption[];
  defaultParentId?: string;
  trigger: ReactNode;
}) {
  return (
    <FormDialog
      title="Tambah agen"
      description="Buat akun agen secara manual. Agen bisa langsung masuk dengan email dan password sementara ini."
      trigger={trigger}
      action={createAgentAction}
      submitLabel="Tambah agen"
      pendingLabel="Menambahkan..."
      size="lg"
    >
      {(state) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nama lengkap" name="name" state={state}>
              <Input id="name" name="name" required className="h-10" />
            </FormField>
            <FormField label="Nomor WhatsApp" name="phone" state={state}>
              <Input id="phone" name="phone" type="tel" placeholder="0812xxxxxxx" required className="h-10" />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Email" name="email" state={state}>
              <Input id="email" name="email" type="email" required className="h-10" />
            </FormField>
            <FormField label="Password sementara" name="password" state={state} hint="Minimal 8 karakter.">
              <PasswordInput id="password" name="password" required className="h-10" />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Sponsor (upline)" name="parentId" state={state}>
              <AgentCombobox name="parentId" nodes={nodes} defaultValue={defaultParentId ?? "root"} />
            </FormField>
            <FormField label="Level" name="levelId" state={state}>
              <LevelSelect name="levelId" levels={levels} withAuto />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Kota" name="city" state={state}>
              <Input id="city" name="city" className="h-10" />
            </FormField>
            <FormField label="Status awal" name="status" state={state}>
              <Select name="status" defaultValue="active">
                <SelectTrigger id="status" className="h-10 w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="pending">Menunggu persetujuan</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Checkbox name="ignoreSlots" />
            Abaikan batas slot downline sponsor
          </label>
        </>
      )}
    </FormDialog>
  );
}

/* -------------------------------------------------------------------------- */

export type EditableAgent = {
  id: string;
  name: string;
  levelId: string;
  status: AgentStatus;
  maxDownlinesOverride: number | null;
  commissionPercentOverride: string | null;
  adminNotes: string | null;
  levelSlots: number | null;
  levelCommission: number;
};

export function EditAgentDialog({
  agent,
  levels,
  trigger,
}: {
  agent: EditableAgent;
  levels: LevelOption[];
  trigger: ReactNode;
}) {
  return (
    <FormDialog
      title={`Atur ${agent.name}`}
      description="Level, batas slot downline, dan komisi khusus untuk agen ini."
      trigger={trigger}
      action={updateAgentAction}
      submitLabel="Simpan perubahan"
      size="lg"
    >
      {(state) => (
        <>
          <input type="hidden" name="id" value={agent.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Level agen" name="levelId" state={state}>
              <LevelSelect name="levelId" levels={levels} defaultValue={agent.levelId} />
            </FormField>
            <FormField label="Status" name="status" state={state}>
              <Select name="status" defaultValue={agent.status}>
                <SelectTrigger id="status" className="h-10 w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="pending">Menunggu persetujuan</SelectItem>
                  <SelectItem value="suspended">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Batas downline langsung"
              name="maxDownlinesOverride"
              state={state}
              hint={`Kosongkan untuk mengikuti level (${agent.levelSlots ?? "tanpa batas"}).`}
            >
              <Input
                id="maxDownlinesOverride"
                name="maxDownlinesOverride"
                type="number"
                min={0}
                defaultValue={agent.maxDownlinesOverride ?? ""}
                placeholder="Ikuti level"
                className="h-10"
              />
            </FormField>
            <FormField
              label="Komisi khusus (%)"
              name="commissionPercentOverride"
              state={state}
              hint={`Kosongkan untuk mengikuti level (${agent.levelCommission}%).`}
            >
              <Input
                id="commissionPercentOverride"
                name="commissionPercentOverride"
                type="number"
                min={0}
                max={100}
                step="0.01"
                defaultValue={agent.commissionPercentOverride ?? ""}
                placeholder="Ikuti level"
                className="h-10"
              />
            </FormField>
          </div>
          <FormField label="Catatan admin" name="adminNotes" state={state}>
            <Textarea id="adminNotes" name="adminNotes" rows={3} defaultValue={agent.adminNotes ?? ""} />
          </FormField>
        </>
      )}
    </FormDialog>
  );
}

/* -------------------------------------------------------------------------- */

export function MoveAgentDialog({
  agent,
  nodes,
  levels,
  trigger,
}: {
  agent: { id: string; name: string; parentId: string | null; levelId: string };
  nodes: TreeNodeData[];
  levels: LevelOption[];
  trigger: ReactNode;
}) {
  // Agen tidak boleh dipindahkan ke dirinya sendiri atau ke dalam jaringannya.
  const excluded = useMemo(() => {
    const children = new Map<string, string[]>();
    for (const n of nodes) {
      if (n.parentId) children.set(n.parentId, [...(children.get(n.parentId) ?? []), n.id]);
    }
    const set = new Set<string>([agent.id]);
    const stack = [agent.id];
    while (stack.length) {
      for (const c of children.get(stack.pop()!) ?? []) {
        set.add(c);
        stack.push(c);
      }
    }
    return set;
  }, [nodes, agent.id]);

  return (
    <FormDialog
      title={`Pindahkan ${agent.name}`}
      description="Seluruh downline agen ini ikut pindah. Komisi yang sudah dibayarkan tidak berubah."
      trigger={trigger}
      action={moveAgentAction}
      submitLabel="Pindahkan"
      pendingLabel="Memindahkan..."
    >
      {(state) => (
        <>
          <input type="hidden" name="id" value={agent.id} />
          <FormField label="Sponsor baru" name="parentId" state={state}>
            <AgentCombobox
              name="parentId"
              nodes={nodes}
              excludeIds={excluded}
              defaultValue={agent.parentId ?? "root"}
            />
          </FormField>
          <FormField
            label="Level setelah dipindahkan"
            name="levelId"
            state={state}
            hint="Ubah bila level agen perlu menyesuaikan posisi barunya."
          >
            <LevelSelect name="levelId" levels={levels} defaultValue={agent.levelId} />
          </FormField>
          <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Checkbox name="ignoreSlots" />
            Abaikan batas slot downline sponsor baru
          </label>
        </>
      )}
    </FormDialog>
  );
}

/* -------------------------------------------------------------------------- */

export function AdjustWalletDialog({
  agentId,
  name,
  trigger,
}: {
  agentId: string;
  name: string;
  trigger: ReactNode;
}) {
  return (
    <FormDialog
      title={`Koreksi saldo ${name}`}
      description="Tambah atau kurangi saldo secara manual. Setiap koreksi tercatat di riwayat dompet."
      trigger={trigger}
      action={adjustWalletAction}
      submitLabel="Simpan koreksi"
    >
      {(state) => (
        <>
          <input type="hidden" name="id" value={agentId} />
          <FormField label="Jenis" name="direction" state={state}>
            <Select name="direction" defaultValue="add">
              <SelectTrigger id="direction" className="h-10 w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Tambah saldo</SelectItem>
                <SelectItem value="subtract">Kurangi saldo</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Nominal (Rp)" name="amount" state={state}>
            <Input id="amount" name="amount" type="number" min={1} step={1} required className="h-10" />
          </FormField>
          <FormField label="Catatan" name="note" state={state}>
            <Input id="note" name="note" required placeholder="Alasan koreksi" className="h-10" />
          </FormField>
        </>
      )}
    </FormDialog>
  );
}

/* -------------------------------------------------------------------------- */

/** Tombol cepat setujui / nonaktifkan / aktifkan kembali. */
export function AgentStatusButton({
  id,
  status,
  size = "sm",
  variant,
}: {
  id: string;
  status: AgentStatus;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary";
}) {
  const [busy, setBusy] = useState(false);

  async function change(next: AgentStatus) {
    setBusy(true);
    const res = await setAgentStatusAction(id, next);
    setBusy(false);
    if (res?.ok) toast.success(res.message);
    else toast.error(res?.error ?? "Gagal mengubah status");
  }

  if (status === "pending") {
    return (
      <Button size={size} variant={variant} disabled={busy} onClick={() => change("active")}>
        Setujui
      </Button>
    );
  }
  if (status === "suspended") {
    return (
      <Button size={size} variant={variant ?? "outline"} disabled={busy} onClick={() => change("active")}>
        Aktifkan
      </Button>
    );
  }
  return (
    <Button size={size} variant={variant ?? "outline"} disabled={busy} onClick={() => change("suspended")}>
      Nonaktifkan
    </Button>
  );
}

