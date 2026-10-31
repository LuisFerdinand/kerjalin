import { Hourglass, ShieldAlert } from "lucide-react";
import type { AgentStatus } from "@/db/schema";

export function AgentStatusBanner({ status }: { status: AgentStatus }) {
  if (status === "active") return null;
  const pending = status === "pending";
  const Icon = pending ? Hourglass : ShieldAlert;
  return (
    <div
      role="status"
      className={
        pending
          ? "mb-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4"
          : "mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
      }
    >
      <Icon className={pending ? "mt-0.5 size-5 shrink-0 text-warning" : "mt-0.5 size-5 shrink-0 text-destructive"} />
      <div className="text-sm text-navy">
        <p className="font-bold">{pending ? "Akun kamu sedang ditinjau" : "Akun kamu dinonaktifkan"}</p>
        <p className="mt-0.5 text-navy/80">
          {pending
            ? "Tim Kerjalin akan segera menyetujui pendaftaranmu. Setelah aktif, komisi dan penarikan bisa digunakan."
            : "Komisi baru tidak akan dicatat dan penarikan tidak tersedia. Hubungi admin Kerjalin untuk informasi lebih lanjut."}
        </p>
      </div>
    </div>
  );
}
