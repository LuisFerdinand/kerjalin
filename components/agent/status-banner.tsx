import type { AgentStatus } from "@/db/schema";

export function AgentStatusBanner({ status }: { status: AgentStatus }) {
  if (status === "active") return null;
  const pending = status === "pending";
  return (
    <div
      role="status"
      className={
        pending
          ? "mb-6 rounded-xl bg-[#fff4d6] px-4 py-3.5 text-[#7a4a00]"
          : "mb-6 rounded-xl bg-[#ffedea] px-4 py-3.5 text-[#831c1e]"
      }
    >
      <p className="text-[0.9375rem] font-semibold">{pending ? "Akun kamu sedang ditinjau" : "Akun kamu dinonaktifkan"}</p>
      <p className="mt-0.5 text-sm">
        {pending
          ? "Tim Kerjalin akan segera menyetujui pendaftaranmu. Setelah aktif, komisi dan penarikan bisa digunakan."
          : "Komisi baru tidak dicatat dan penarikan tidak tersedia. Hubungi admin Kerjalin untuk informasi lebih lanjut."}
      </p>
    </div>
  );
}
