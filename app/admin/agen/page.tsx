import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AgentStatusBadge, LevelBadge } from "@/components/app/badges";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { AddAgentDialog, AgentStatusButton } from "@/components/admin/agent-dialogs";
import { AGENT_STATUSES } from "@/db/schema";
import { formatDate, formatIDR, initials } from "@/lib/format";
import { listAgents, getTreeNodes, listLevelOptions } from "@/lib/queries/admin";
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

  const [result, levels, nodes] = await Promise.all([
    listAgents({ q, status, levelId, page }),
    listLevelOptions(),
    getTreeNodes(),
  ]);
  const hasFilters = Boolean(q || status || levelId);

  return (
    <>
      <PageHeader
        title="Agen"
        description="Kelola seluruh agen: setujui pendaftar baru, atur level, dan pantau saldo."
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

      <Card className="gap-0 overflow-hidden p-0">
        <form action="/admin/agen" className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Cari nama, email, WhatsApp, atau kode referral..."
              className="h-10 pl-9"
            />
          </div>
          <NativeSelect name="status" defaultValue={status ?? ""} className="sm:w-44" aria-label="Status">
            <option value="">Semua status</option>
            <option value="pending">Menunggu</option>
            <option value="active">Aktif</option>
            <option value="suspended">Nonaktif</option>
          </NativeSelect>
          <NativeSelect name="level" defaultValue={levelId ?? ""} className="sm:w-48" aria-label="Level">
            <option value="">Semua level</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit">Terapkan</Button>
          {hasFilters && (
            <Button asChild variant="ghost">
              <Link href="/admin/agen">Reset</Link>
            </Button>
          )}
        </form>

        {result.rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title={hasFilters ? "Tidak ada agen yang cocok" : "Belum ada agen"}
              description={
                hasFilters
                  ? "Coba ubah kata kunci atau filter."
                  : "Agen akan muncul di sini setelah mendaftar atau kamu tambahkan manual."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Agen</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead className="text-center">Tim</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="pr-5 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="pl-5">
                      <Link href={`/admin/agen/${a.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar className="size-9">
                          {a.image && <AvatarImage src={a.image} alt="" />}
                          <AvatarFallback className="bg-brand/10 text-xs font-bold text-brand">
                            {initials(a.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-navy">{a.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{a.email}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <LevelBadge name={a.levelName} color={a.levelColor} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.parentName ?? <span className="text-muted-foreground">Kerjalin</span>}
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold tabular-nums">{a.directCount}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatIDR(a.balance)}</TableCell>
                    <TableCell>
                      <AgentStatusBadge status={a.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="flex justify-end gap-2">
                        {a.status === "pending" && <AgentStatusButton id={a.id} status={a.status} variant="default" />}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/agen/${a.id}`}>Detail</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="border-t p-4">
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            basePath="/admin/agen"
            params={{ q, status, level: levelId }}
          />
        </div>
      </Card>
    </>
  );
}
