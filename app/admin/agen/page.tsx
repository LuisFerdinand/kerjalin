import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AgentStatusBadge, LevelBadge } from "@/components/app/badges";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { TabsNav } from "@/components/app/tabs-nav";
import { AddAgentDialog, AgentStatusButton } from "@/components/admin/agent-dialogs";
import { AGENT_STATUSES } from "@/db/schema";
import { formatDate, formatIDR, initials } from "@/lib/format";
import { getAgentCounts, getTreeNodes, listAgents, listLevelOptions } from "@/lib/queries/admin";
import { first, pageParam, pickEnum } from "@/lib/search-params";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Agen" };

export default async function AgentsPage(props: PageProps<"/admin/agen">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = first(sp.q);
  const status = pickEnum(sp.status, AGENT_STATUSES);
  const levelId = first(sp.level);
  const page = pageParam(sp.page);

  const [result, levels, nodes, counts] = await Promise.all([
    listAgents({ q, status, levelId, page }),
    listLevelOptions(),
    getTreeNodes(),
    getAgentCounts(),
  ]);
  const hasFilters = Boolean(q || levelId);

  const tab = (label: string, value: (typeof AGENT_STATUSES)[number] | undefined, count: number) => {
    const p = new URLSearchParams();
    if (value) p.set("status", value);
    if (q) p.set("q", q);
    if (levelId) p.set("level", levelId);
    const qs = p.toString();
    return { label, count, active: status === value, href: qs ? `/admin/agen?${qs}` : "/admin/agen" };
  };

  return (
    <>
      <PageHeader
        title="Agen"
        description="Setujui pendaftar baru, atur level, dan pantau saldo setiap agen."
        actions={
          <AddAgentDialog
            nodes={nodes}
            levels={levels}
            trigger={
              <Button>
                <UserPlus /> Tambah agen
              </Button>
            }
          />
        }
      />

      <TabsNav
        label="Status agen"
        items={[
          tab("Semua", undefined, counts.all),
          tab("Menunggu", "pending", counts.pending),
          tab("Aktif", "active", counts.active),
          tab("Nonaktif", "suspended", counts.suspended),
        ]}
      />

      <form action="/admin/agen" className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <Input name="q" defaultValue={q} placeholder="Cari nama, email, WhatsApp, atau kode" className="pl-9" aria-label="Cari agen" />
        </div>
        <NativeSelect name="level" defaultValue={levelId ?? ""} className="sm:w-48" aria-label="Level">
          <option value="">Semua level</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline">
          Terapkan
        </Button>
        {hasFilters && (
          <Button asChild variant="ghost">
            <Link href={status ? `/admin/agen?status=${status}` : "/admin/agen"}>Reset</Link>
          </Button>
        )}
        <p className="text-[0.8125rem] text-muted-foreground sm:ml-auto">{result.total} agen</p>
      </form>

      {result.rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters || status ? "Tidak ada agen yang cocok" : "Belum ada agen"}
          description={
            hasFilters || status
              ? "Coba ubah kata kunci atau filter."
              : "Agen akan muncul di sini setelah mendaftar atau kamu tambahkan manual."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Agen</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead className="text-right">Downline</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="pl-5">
                      <Link href={`/admin/agen/${a.id}`} className="flex items-center gap-3">
                        <Avatar className="size-10">
                          {a.image && <AvatarImage src={a.image} alt="" />}
                          <AvatarFallback className="bg-brand-soft text-xs font-semibold text-navy">
                            {initials(a.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate text-[0.9375rem] font-semibold text-navy hover:underline">{a.name}</span>
                          <span className="block truncate text-[0.8125rem] text-muted-foreground">{a.email}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <LevelBadge name={a.levelName} color={a.levelColor} />
                    </TableCell>
                    <TableCell>{a.parentName ?? <span className="text-muted-foreground">Kerjalin</span>}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.directCount}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatIDR(a.balance)}</TableCell>
                    <TableCell>
                      <AgentStatusBadge status={a.status} />
                    </TableCell>
                    <TableCell className="text-[0.8125rem] text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                    <TableCell className="pr-5 text-right">
                      {a.status === "pending" ? (
                        <AgentStatusButton id={a.id} status={a.status} variant="default" />
                      ) : (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/agen/${a.id}`}>Detail</Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="pt-4">
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          basePath="/admin/agen"
          noun="agen"
          params={{ q, status, level: levelId }}
        />
      </div>
    </>
  );
}
