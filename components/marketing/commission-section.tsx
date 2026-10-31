import { Check, Network } from "lucide-react";
import { formatIDR, formatPercent } from "@/lib/format";
import { getPublicLevels } from "@/lib/queries/public";
import { Reveal } from "./reveal";

export type PublicLevel = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  commissionPercent: string | number;
  overridePercents: number[];
};

export const fallbackLevels: PublicLevel[] = [
  {
    id: "1",
    name: "Agen Utama",
    color: "#F5A524",
    description: "Komisi terbesar dan bonus dari dua tingkat tim.",
    commissionPercent: 50,
    overridePercents: [10, 5],
  },
  {
    id: "2",
    name: "Agen Reseller",
    color: "#0B78F0",
    description: "Boleh merekrut Sub-Agen dan mendapat bonus tim.",
    commissionPercent: 40,
    overridePercents: [10],
  },
  {
    id: "3",
    name: "Sub-Agen",
    color: "#12A06B",
    description: "Fokus menjual langsung ke pelanggan.",
    commissionPercent: 35,
    overridePercents: [],
  },
];

export async function loadPublicLevels(): Promise<PublicLevel[]> {
  const levels = await getPublicLevels();
  return levels.length ? levels : fallbackLevels;
}

export function CommissionSection({ levels }: { levels: PublicLevel[] }) {
  const top = levels[0];
  const topPct = Number(top.commissionPercent);
  const example = 100_000;
  const mine = Math.floor((example * topPct) / 100);

  return (
    <section id="komisi" className="scroll-mt-20 bg-cream/60 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="text-sm font-bold tracking-widest text-brand uppercase">Skema komisi</p>
          <h2 className="mt-3 text-3xl font-extrabold text-balance text-navy sm:text-4xl">
            Transparan: kamu tahu persis berapa yang kamu dapat
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-navy/70">
            Setiap langganan yang masuk lewat kamu langsung dibagi sesuai level agen. Tidak ada
            potongan tersembunyi, dan semua tercatat di dashboard.
          </p>

          <div className="mt-8 rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold text-navy">
              Contoh: layanan {formatIDR(example)} per bulan
            </p>
            <div className="mt-4 flex h-12 overflow-hidden rounded-xl text-sm font-bold">
              <div
                className="flex items-center justify-center bg-brand text-white"
                style={{ width: `${topPct}%` }}
              >
                Kamu {formatIDR(mine)}
              </div>
              <div className="flex flex-1 items-center justify-center bg-navy text-cream">
                Kerjalin {formatIDR(example - mine)}
              </div>
            </div>
            <ul className="mt-5 grid gap-2.5 text-sm text-navy/80">
              {[
                "Komisi dihitung otomatis setiap pesanan lunas",
                "Bonus tim tidak mengurangi komisi anggota timmu",
                "Saldo bisa ditarik ke rekening bank",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <div className="grid gap-4">
          {levels.map((lvl, i) => (
            <Reveal key={lvl.id} delay={i * 0.1}>
              <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm">
                <span
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{ backgroundColor: lvl.color }}
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-4 pl-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Level {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-0.5 text-xl font-extrabold text-navy">{lvl.name}</h3>
                    {lvl.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{lvl.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-3xl font-extrabold" style={{ color: lvl.color }}>
                      {formatPercent(lvl.commissionPercent)}
                    </p>
                    <p className="text-xs text-muted-foreground">komisi penjualan</p>
                  </div>
                </div>
                {lvl.overridePercents.length > 0 && (
                  <div className="mt-4 ml-2 flex flex-wrap items-center gap-2 border-t pt-3.5 text-sm">
                    <Network className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Bonus tim:</span>
                    {lvl.overridePercents.map((p, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-navy"
                      >
                        Tingkat {idx + 1}: {formatPercent(p)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
          <p className="px-1 text-xs text-muted-foreground">
            Persentase dapat berubah sewaktu-waktu. Level awal untuk agen baru ditentukan Kerjalin
            atau sponsor yang mengajak.
          </p>
        </div>
      </div>
    </section>
  );
}
