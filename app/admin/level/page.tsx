import type { Metadata } from "next";
import { ArrowRight, Calculator, Network, Pencil, Plus, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { DeleteLevelButton, LevelFormDialog } from "@/components/admin/level-form";
import { formatIDR, formatPercent } from "@/lib/format";
import { listLevels } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Level & Komisi" };

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
        title="Level & Komisi"
        description="Tentukan level agen, persentase komisi, bonus tim, jumlah downline, dan level rekrutan."
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {levels.map((l) => (
          <Card key={l.id} className="relative gap-4 overflow-hidden p-5">
            <span className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: l.color }} aria-hidden />
            <div className="flex items-start justify-between gap-3 pt-1">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Urutan {l.rank}
                  </span>
                  {l.isDefault && (
                    <Badge className="gap-1 bg-warning/15 text-warning hover:bg-warning/15">
                      <Star className="size-3" /> Level awal
                    </Badge>
                  )}
                </div>
                <h3 className="mt-1 text-xl font-extrabold" style={{ color: l.color }}>
                  {l.name}
                </h3>
                {l.description && <p className="mt-1 text-sm text-muted-foreground">{l.description}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
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
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/70 p-3">
                <dt className="text-xs text-muted-foreground">Komisi penjualan</dt>
                <dd className="mt-0.5 text-2xl font-extrabold text-navy">{formatPercent(l.commissionPercent)}</dd>
              </div>
              <div className="rounded-xl bg-muted/70 p-3">
                <dt className="text-xs text-muted-foreground">Slot downline</dt>
                <dd className="mt-0.5 text-2xl font-extrabold text-navy">{l.maxDownlines ?? "∞"}</dd>
              </div>
            </dl>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Network className="size-4" /> Bonus tim
                </span>
                <span className="flex flex-wrap justify-end gap-1.5">
                  {l.overridePercents.length === 0 ? (
                    <span className="text-muted-foreground">Tidak ada</span>
                  ) : (
                    l.overridePercents.map((p, i) => (
                      <Badge key={i} variant="secondary" className="font-semibold">
                        T{i + 1}: {formatPercent(p)}
                      </Badge>
                    ))
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ArrowRight className="size-4" /> Rekrutan menjadi
                </span>
                <span className="font-semibold text-navy">{l.downlineLevelName ?? "Tidak bisa merekrut"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4" /> Agen di level ini
                </span>
                <span className="font-bold text-navy">{l.agentCount}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {levels.length > 0 && (
        <Card className="mt-6 gap-0 overflow-hidden p-0">
          <CardHeader className="border-b py-5">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="size-5 text-brand" /> Simulasi pembagian komisi
            </CardTitle>
            <CardDescription>
              Contoh satu langganan {formatIDR(SAMPLE)} yang terjual oleh agen di tiap level, lengkap dengan bonus
              tim ke upline-nya. Sisanya menjadi pendapatan Kerjalin.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Penjual</TableHead>
                  <TableHead>Rincian untuk agen</TableHead>
                  <TableHead className="text-right">Total agen</TableHead>
                  <TableHead className="pr-6 text-right">Kerjalin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulation.map(({ seller, parts, agentPct }) => (
                  <TableRow key={seller.id}>
                    <TableCell className="pl-6 font-bold" style={{ color: seller.color }}>
                      {seller.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        {parts.map((p, i) => (
                          <span key={p.level.id} className="whitespace-nowrap">
                            <span className="text-muted-foreground">
                              {i === 0 ? "Penjual" : `Upline ${i}`} ({p.level.name}):
                            </span>{" "}
                            <strong className="tabular-nums">{formatIDR((SAMPLE * p.pct) / 100)}</strong>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatIDR((SAMPLE * agentPct) / 100)}{" "}
                      <span className="text-xs text-muted-foreground">({formatPercent(agentPct)})</span>
                    </TableCell>
                    <TableCell
                      className={`pr-6 text-right font-bold tabular-nums ${agentPct > 100 ? "text-destructive" : "text-navy"}`}
                    >
                      {formatIDR(SAMPLE - (SAMPLE * agentPct) / 100)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
