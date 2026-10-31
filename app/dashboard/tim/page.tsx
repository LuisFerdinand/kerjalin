import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { ChevronRight, ShieldCheck, Users } from "lucide-react";
import { db } from "@/db";
import { agentLevels } from "@/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AgentStatusBadge, LevelBadge } from "@/components/app/badges";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { ReferralCard } from "@/components/agent/referral-card";
import { siteConfig } from "@/lib/config";
import { formatDate, formatIDR, initials } from "@/lib/format";
import { effectiveSlots } from "@/lib/mlm";
import { getTeam, type TeamMember } from "@/lib/queries/agent";
import { requireAgent } from "@/lib/session";

export const metadata: Metadata = { title: "Tim Saya" };

export default async function TeamPage() {
  const { agent, level } = await requireAgent();
  const team = await getTeam(agent);
  const slots = effectiveSlots(agent, level);
  const direct = team.filter((m) => m.parentId === null).length;
  const [recruitLevel] = level.downlineLevelId
    ? await db.select().from(agentLevels).where(eq(agentLevels.id, level.downlineLevelId)).limit(1)
    : [];
  const canRecruit = Boolean(recruitLevel) && (slots === null || slots > 0);

  const childrenOf = new Map<string | null, TeamMember[]>();
  for (const m of team) childrenOf.set(m.parentId, [...(childrenOf.get(m.parentId) ?? []), m]);

  const bonus = team.reduce((sum, m) => sum + m.bonusEarned, 0);

  return (
    <>
      <PageHeader
        title="Tim Saya"
        description="Agen yang bergabung lewat tautan referralmu beserta downline mereka."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid content-start gap-6">
          {canRecruit ? (
            <ReferralCard
              link={`${siteConfig.url}/r/${agent.referralCode}`}
              code={agent.referralCode}
              slotText={slots === null ? "Slot tak terbatas" : `${direct}/${slots} slot`}
            />
          ) : (
            <Card className="flex-row items-start gap-3 p-5">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Level <strong className="text-navy">{level.name}</strong> tidak membuka perekrutan agen baru.
                Fokus menjual layanan ke pelanggan untuk mendapat komisi.
              </p>
            </Card>
          )}

          <Card className="gap-4 p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-extrabold text-navy">{direct}</p>
                <p className="text-xs text-muted-foreground">Langsung</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-navy">{team.length}</p>
                <p className="text-xs text-muted-foreground">Total tim</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-success tabular-nums">{formatIDR(bonus)}</p>
                <p className="text-xs text-muted-foreground">Bonus tim</p>
              </div>
            </div>
            {slots !== null && (
              <div className="grid gap-1.5">
                <Progress value={Math.min(100, (direct / Math.max(1, slots)) * 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {direct} dari {slots} slot downline langsung terpakai
                  {recruitLevel && <> · rekrutan menjadi <strong className="text-navy">{recruitLevel.name}</strong></>}
                </p>
              </div>
            )}
          </Card>
        </div>

        <Card className="gap-3 p-4 sm:p-5">
          {team.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada anggota tim"
              description="Bagikan tautan referralmu. Setiap agen yang mendaftar akan muncul di sini."
            />
          ) : (
            <TeamBranch list={childrenOf.get(null) ?? []} childrenOf={childrenOf} />
          )}
        </Card>
      </div>
    </>
  );
}

function TeamBranch({
  list,
  childrenOf,
}: {
  list: TeamMember[];
  childrenOf: Map<string | null, TeamMember[]>;
}) {
  return (
    <ul className="grid gap-2">
      {list.map((m) => {
        const kids = childrenOf.get(m.id) ?? [];
        return (
          <li key={m.id}>
            <details open={m.relDepth <= 1} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                <ChevronRight
                  className={`size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 ${kids.length === 0 ? "invisible" : ""}`}
                />
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border bg-card px-3 py-2.5">
                  <Avatar className="size-9">
                    {m.image && <AvatarImage src={m.image} alt="" />}
                    <AvatarFallback className="text-xs font-bold text-white" style={{ backgroundColor: m.levelColor }}>
                      {initials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-sm font-bold text-navy">{m.name}</span>
                      <LevelBadge name={m.levelName} color={m.levelColor} />
                      {m.status !== "active" && <AgentStatusBadge status={m.status} />}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Tingkat {m.relDepth} · bergabung {formatDate(m.joinedAt)} · {m.salesCount} penjualan
                      {m.directCount > 0 && ` · ${m.directCount} downline`}
                    </p>
                  </div>
                  {m.bonusEarned !== 0 && (
                    <span className="shrink-0 text-right text-xs">
                      <span className="block text-muted-foreground">Bonus</span>
                      <strong className="text-success tabular-nums">{formatIDR(m.bonusEarned)}</strong>
                    </span>
                  )}
                </div>
              </summary>
              {kids.length > 0 && (
                <div className="mt-2 ml-2.5 border-l-2 border-dashed pl-4">
                  <TeamBranch list={kids} childrenOf={childrenOf} />
                </div>
              )}
            </details>
          </li>
        );
      })}
    </ul>
  );
}

