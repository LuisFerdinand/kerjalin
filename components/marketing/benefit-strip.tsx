import { Banknote, LayoutGrid, Megaphone, Wallet } from "lucide-react";

const items = [
  { icon: Wallet, title: "Tanpa Modal Besar", text: "Cukup daftar dan mulai jual" },
  { icon: LayoutGrid, title: "Banyak Pilihan Produk", text: "Aplikasi dan layanan untuk UMKM" },
  { icon: Megaphone, title: "Dukungan Lengkap", text: "Link referral siap pakai dan tim yang membantu" },
  { icon: Banknote, title: "Komisi Menarik", text: "Cair langsung ke rekening kamu" },
];

/** Empat keunggulan dalam satu kartu, menumpang di tepi bawah hero. */
export function BenefitStrip() {
  return (
    <section aria-label="Keunggulan" className="relative z-10 mx-auto -mt-10 w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <ul className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-float sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center gap-4 bg-white p-5 lg:p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-navy">
              <Icon className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-navy">{title}</p>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
