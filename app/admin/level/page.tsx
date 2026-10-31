import type { Metadata } from "next";
import { Pencil, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, Panel } from "@/components/app/page-header";
import { DeleteLevelButton, LevelFormDialog } from "@/components/admin/level-form";
import { formatIDR, formatPercent } from "@/lib/format";
import { listLevels } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Level & komisi" };

const SAMPLE = 100_000;

export default async function LevelsPage() {
  await requireAdmin();
  const levels = await listLevels();
  const options = levels.map((l) => ({ id: l.id, name: l.name }));
  const nextRank = (levels.at(-1)?.rank ?? 0) + 1;

  // Simulasi pembagian: penjual level L, upline = level yang merekrut level tersebut.
  const simulation = levels.map((seller) => {
    const chain = [seller];
    let cur = seller;
    for (let i = 0; i < 5; i++) {
      const parent = levels.find((l) => l.downlineLevelId === cur.id && !chain.includes(l));
      if (!parent) break;
      chain.push(parent);
      cur = parent;
    }
    const parts = chain.map((lvl, i) => ({
      level: lvl,
      pct: i === 0 ? Number(lvl.commissionPercent) : Number(lvl.overridePercents[i - 1] ?? 0),
    }));
    const agentPct = parts.reduce((a, p) => a + p.pct, 0);
    return { seller, parts, agentPct };
  });

  return (
    <>
      <PageHeader
        title="Level & komisi"
        description="Tentukan persentase komisi, bonus tim, jumlah downline, dan level yang didapat rekrutan."
        actions={
          <LevelFormDialog
            allLevels={options}
            nextRank={nextRank}
            trigger={
              <Button>
                <Plus /> Tambah level
              </Button>
            }
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {levels.map((l) => (
          <Panel
            key={l.id}
            title={
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: l.color }} aria-hidden />
                {l.name}
                {l.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4d6] px-2 py-0.5 text-[0.8125rem] font-medium text-[#7a4a00]">
                    <Star className="size-3" /> Level awal
                  </span>
                )}
              </span>
            }
            description={l.description ?? undefined}
            action={
              <span className="flex gap-0.5">
                <LevelFormDialog
                  level={{
                    id: l.id,
                    name: l.name,
                    rank: l.rank,
                    description: l.description,
                    color: l.color,
                    commissionPercent: l.commissionPercent,
                    overridePercents: l.overridePercents,
                    maxDownlines: l.maxDownlines,
                    downlineLevelId: l.downlineLevelId,
                    isDefault: l.isDefault,
                  }}
                  allLevels={options}
                  nextRank={nextRank}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Ubah level ${l.name}`}>
                      <Pencil />
                    </Button>
                  }
                />
                <DeleteLevelButton id={l.id} name={l.name} disabled={l.agentCount > 0} />
              </span>
            }
          >
            <dl className="grid gap-x-4 gap-y-3.5">
              <div className="grid grid-cols-2 gap-4 border-b border-rule pb-4">
                <div>
                  <dt className="text-[0.8125rem] text-muted-foreground">Komisi penjualan</dt>
                  <dd className="mt-0.5 text-[1.5rem] font-semibold tabular-nums text-navy">{formatPercent(l.commissionPercent)}</dd>
                </div>
                <div>
                  <dt className="text-[0.8125rem] text-muted-foreground">Slot downline</dt>
                  <dd className="mt-0.5 text-[1.5rem] font-semibold tabular-nums text-navy">{l.maxDownlines ?? "∞"}</dd>
                </div>
              </div>
              <Line label="Bonus tim">
                {l.overridePercents.length === 0
                  ? "Tidak ada"
                  : l.overridePercents.map((p, i) => `Tingkat ${i + 1}: ${formatPercent(p)}`).join(" · ")}
              </Line>
              <Line label="Rekrutan menjadi">{l.downlineLevelName ?? "Tidak bisa merekrut"}</Line>
              <Line label="Agen di level ini">{l.agentCount}</Line>
            </dl>
          </Panel>
        ))}
      </div>

      {levels.length > 0 && (
        <Panel
          className="mt-6"
          title="Simulasi pembagian komisi"
          description={`Satu langganan ${formatIDR(SAMPLE)} yang terjual oleh agen di tiap level, beserta bonus tim ke upline-nya. Sisanya menjadi bagian Kerjalin.`}
          flush
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Penjual</TableHead>
                  <TableHead>Rincian untuk agen</TableHead>
                  <TableHead className="text-right">Total agen</TableHead>
                  <TableHead className="pr-5 text-right">Kerjalin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulation.map(({ seller, parts, agentPct }) => (
                  <TableRow key={seller.id}>
                    <TableCell className="pl-5 font-semibold text-navy">
                      <span className="inline-flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ backgroundColor: seller.color }} aria-hidden />
                        {seller.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                        {parts.map((p, i) => (
                          <span key={p.level.id} className="whitespace-nowrap">
                            <span className="text-muted-foreground">
                              {i === 0 ? "Penjual" : `Upline ${i}`} ({p.level.name}):
                            </span>{" "}
                            <span className="font-medium tabular-nums text-navy">{formatIDR((SAMPLE * p.pct) / 100)}</span>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatIDR((SAMPLE * agentPct) / 100)}{" "}
                      <span className="text-[0.8125rem] font-normal text-muted-foreground">({formatPercent(agentPct)})</span>
                    </TableCell>
                    <TableCell
                      className={`pr-5 text-right font-semibold tabular-nums ${agentPct > 100 ? "text-negative" : "text-navy"}`}
                    >
                      {formatIDR(SAMPLE - (SAMPLE * agentPct) / 100)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      )}
    </>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[0.9375rem]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-navy">{children}</dd>
    </div>
  );
}
