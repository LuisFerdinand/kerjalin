import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { ChevronRight, Users } from "lucide-react";
import { db } from "@/db";
import { agentLevels } from "@/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AgentStatusBadge, LevelBadge } from "@/components/app/badges";
import { EmptyState, KpiStrip, PageHeader, Panel } from "@/components/app/page-header";
import { ReferralCard } from "@/components/agent/referral-card";
import { SlotStrip } from "@/components/agent/slot-strip";
import { siteConfig } from "@/lib/config";
import { formatDate, formatIDR, initials } from "@/lib/format";
import { effectiveSlots } from "@/lib/mlm";
import { getSponsorName, getTeam, type TeamMember } from "@/lib/queries/agent";
import { requireAgent } from "@/lib/session";

export const metadata: Metadata = { title: "Tim saya" };

export default async function TeamPage() {
  const { agent, level } = await requireAgent();
  const [team, sponsor] = await Promise.all([getTeam(agent), getSponsorName(agent)]);
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
        title="Tim saya"
        description="Agen yang bergabung lewat tautan referralmu, beserta downline mereka."
      />

      <KpiStrip
        items={[
          { label: "Agen langsung", value: direct, hint: slots === null ? "Slot tanpa batas" : `dari ${slots} slot` },
          { label: "Seluruh tim", value: team.length, hint: "Semua tingkat downline" },
          { label: "Bonus tim diterima", value: formatIDR(bonus), hint: "Dari penjualan downline", lead: true },
        ]}
      />

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="grid gap-6">
          {canRecruit ? (
            <ReferralCard link={`${siteConfig.url}/r/${agent.referralCode}`} code={agent.referralCode}>
              <SlotStrip used={direct} slots={slots} sponsor={sponsor} nextLevel={recruitLevel?.name ?? null} />
            </ReferralCard>
          ) : (
            <Panel title="Perekrutan">
              <p className="text-[0.9375rem] text-muted-foreground">
                Level <strong className="text-navy">{level.name}</strong> tidak membuka perekrutan agen baru. Fokus menjual
                layanan ke pelanggan untuk mendapat komisi.
              </p>
            </Panel>
          )}
        </div>

        <Panel title="Susunan tim">
          {team.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada anggota tim"
              description="Bagikan tautan referralmu. Setiap agen yang mendaftar akan muncul di sini."
            />
          ) : (
            <TeamBranch list={childrenOf.get(null) ?? []} childrenOf={childrenOf} />
          )}
        </Panel>
      </div>
    </>
  );
}

function TeamBranch({ list, childrenOf }: { list: TeamMember[]; childrenOf: Map<string | null, TeamMember[]> }) {
  return (
    <ul className="grid gap-2">
      {list.map((m) => {
        const kids = childrenOf.get(m.id) ?? [];
        return (
          <li key={m.id}>
            <details open={m.relDepth <= 1} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                <ChevronRight
                  className={`size-4 shrink-0 text-faint transition-transform group-open:rotate-90 ${kids.length === 0 ? "invisible" : ""}`}
                />
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                  <Avatar className="size-9">
                    {m.image && <AvatarImage src={m.image} alt="" />}
                    <AvatarFallback className="bg-brand-soft text-xs font-semibold text-navy">{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-[0.9375rem] font-semibold text-navy">{m.name}</span>
                      <LevelBadge name={m.levelName} color={m.levelColor} />
                      {m.status !== "active" && <AgentStatusBadge status={m.status} />}
                    </div>
                    <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
                      Tingkat {m.relDepth} · bergabung {formatDate(m.joinedAt)} · {m.salesCount} penjualan
                      {m.directCount > 0 && ` · ${m.directCount} downline`}
                    </p>
                  </div>
                  {m.bonusEarned !== 0 && (
                    <span className="shrink-0 text-right text-[0.8125rem]">
                      <span className="block text-muted-foreground">Bonus</span>
                      <strong className="font-semibold tabular-nums text-positive">{formatIDR(m.bonusEarned)}</strong>
                    </span>
                  )}
                </div>
              </summary>
              {kids.length > 0 && (
                <div className="mt-2 ml-2.5 border-l border-input pl-4">
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
