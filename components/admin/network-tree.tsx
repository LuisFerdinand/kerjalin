"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  ChevronRight,
  Copy,
  Crown,
  ExternalLink,
  Network,
  Phone,
  Search,
  Settings2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AgentStatusBadge, LevelBadge } from "@/components/app/badges";
import {
  AddAgentDialog,
  AgentStatusButton,
  EditAgentDialog,
  MoveAgentDialog,
  type LevelOption,
} from "@/components/admin/agent-dialogs";
import { formatCompact, formatIDR, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TreeNodeData } from "@/lib/queries/admin";

export function NetworkTree({ nodes, levels }: { nodes: TreeNodeData[]; levels: LevelOption[] }) {
  // Panel detail tampil di samping pohon hanya di layar lebar; selain itu berupa lembar dari bawah.
  const isCompact = useMediaQuery("(max-width: 1279px)");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(nodes.filter((n) => n.depth <= 2).map((n) => n.id)),
  );

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const childrenOf = useMemo(() => {
    const map = new Map<string | null, TreeNodeData[]>();
    for (const n of nodes) map.set(n.parentId, [...(map.get(n.parentId) ?? []), n]);
    return map;
  }, [nodes]);
  const roots = childrenOf.get(null) ?? [];

  const descendants = (id: string) => {
    let count = 0;
    const stack = [id];
    while (stack.length) {
      for (const c of childrenOf.get(stack.pop()!) ?? []) {
        count++;
        stack.push(c.id);
      }
    }
    return count;
  };

  // Pencarian: tampilkan hanya cabang yang memuat hasil.
  const q = query.trim().toLowerCase();
  const { matchIds, visibleIds } = useMemo(() => {
    if (!q) return { matchIds: new Set<string>(), visibleIds: null as Set<string> | null };
    const match = new Set<string>();
    const visible = new Set<string>();
    for (const n of nodes) {
      if (`${n.name} ${n.email} ${n.referralCode}`.toLowerCase().includes(q)) {
        match.add(n.id);
        let cur: TreeNodeData | undefined = n;
        while (cur) {
          visible.add(cur.id);
          cur = cur.parentId ? byId.get(cur.parentId) : undefined;
        }
      }
    }
    return { matchIds: match, visibleIds: visible };
  }, [q, nodes, byId]);

  const selected = selectedId ? byId.get(selectedId) : undefined;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderBranch(list: TreeNodeData[]) {
    const items = visibleIds ? list.filter((n) => visibleIds.has(n.id)) : list;
    if (items.length === 0) return null;
    return (
      <ul className="grid gap-2">
        {items.map((n) => {
          const kids = childrenOf.get(n.id) ?? [];
          const isOpen = visibleIds ? true : expanded.has(n.id);
          const isSelected = n.id === selectedId;
          const full = n.slots !== null && n.directCount >= n.slots;
          return (
            <li key={n.id}>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggle(n.id)}
                  disabled={kids.length === 0}
                  aria-label={isOpen ? "Ciutkan" : "Perluas"}
                  aria-expanded={kids.length ? isOpen : undefined}
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent",
                    kids.length === 0 && "invisible",
                  )}
                >
                  <ChevronRight className={cn("size-4 transition-transform", isOpen && "rotate-90")} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId(n.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "group flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-navy/40",
                    isSelected && "border-navy bg-brand-soft ring-1 ring-navy",
                    matchIds.has(n.id) && !isSelected && "border-warning bg-[#fff4d6]",
                    n.status === "suspended" && "opacity-60",
                  )}
                >
                  <span className="relative">
                    <Avatar className="size-9">
                      {n.image && <AvatarImage src={n.image} alt="" />}
                      <AvatarFallback className="bg-brand-soft text-xs font-semibold text-navy">
                        {initials(n.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-card",
                        n.status === "active" && "bg-success",
                        n.status === "pending" && "bg-warning",
                        n.status === "suspended" && "bg-destructive",
                      )}
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="truncate text-sm font-semibold text-navy">{n.name}</span>
                      <LevelBadge name={n.levelName} color={n.levelColor} />
                    </span>
                    <span className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className={cn("inline-flex items-center gap-1", full && "font-semibold text-warning")}>
                        <Users className="size-3" />
                        {n.directCount}/{n.slots ?? "∞"}
                      </span>
                      <span className="tabular-nums">Rp {formatCompact(n.earned)}</span>
                    </span>
                  </span>
                </button>
              </div>
              {kids.length > 0 && isOpen && (
                <div className="mt-2 ml-3 border-l-2 border-dashed border-border pl-4">{renderBranch(kids)}</div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  const details = selected && (
    <NodeDetails
      node={selected}
      sponsorName={selected.parentId ? byId.get(selected.parentId)?.name : undefined}
      teamSize={descendants(selected.id)}
      nodes={nodes}
      levels={levels}
      onClose={() => setSelectedId(null)}
    />
  );

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, email, atau kode referral..."
              className="h-10 pl-9"
              aria-label="Cari agen di pohon"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(new Set(nodes.filter((n) => childrenOf.has(n.id)).map((n) => n.id)))}
            >
              Perluas semua
            </Button>
            <Button variant="outline" size="sm" onClick={() => setExpanded(new Set())}>
              Ciutkan
            </Button>
          </div>
        </div>

        {/* Akar: Kerjalin */}
        <div className="flex items-center gap-3 rounded-lg bg-navy p-3.5 text-white">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/10">
            <Crown className="size-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Kerjalin · Super Admin</p>
            <p className="text-[0.8125rem] text-white/80">
              {roots.length} agen langsung · {nodes.length} agen di seluruh jaringan
            </p>
          </div>
          <AddAgentDialog
            nodes={nodes}
            levels={levels}
            trigger={
              <Button size="sm" variant="secondary" className="shrink-0">
                <UserPlus /> <span className="hidden sm:inline">Tambah agen</span>
              </Button>
            }
          />
        </div>

        <div className="ml-3 border-l-2 border-dashed border-border pl-4">
          {nodes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <Network className="size-8" />
              <p className="text-sm">Belum ada agen. Tambahkan agen pertama atau tunggu pendaftaran.</p>
            </div>
          ) : visibleIds && visibleIds.size === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada agen yang cocok dengan “{query}”.</p>
          ) : (
            renderBranch(roots)
          )}
        </div>

        <Legend />
      </Card>

      {/* Panel detail — desktop */}
      <div className="sticky top-20 hidden xl:block">
        {details ?? (
          <Card className="items-center gap-2 border-dashed p-8 text-center text-muted-foreground">
            <Network className="size-8" />
            <p className="text-sm font-medium">Pilih agen di pohon untuk melihat detail dan mengelola posisinya.</p>
          </Card>
        )}
      </div>

      {/* Panel detail — seluler */}
      <Sheet open={Boolean(selected) && isCompact} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Detail agen</SheetTitle>
          </SheetHeader>
          {isCompact && details}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-success" /> Aktif
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-warning" /> Menunggu
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-destructive" /> Nonaktif
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users className="size-3" /> terpakai/slot downline
      </span>
    </div>
  );
}

function NodeDetails({
  node,
  sponsorName,
  teamSize,
  nodes,
  levels,
  onClose,
}: {
  node: TreeNodeData;
  sponsorName?: string;
  teamSize: number;
  nodes: TreeNodeData[];
  levels: LevelOption[];
  onClose: () => void;
}) {
  const slotPct = node.slots ? Math.min(100, (node.directCount / node.slots) * 100) : 0;

  async function copyCode() {
    await navigator.clipboard.writeText(node.referralCode);
    toast.success("Kode referral disalin");
  }

  return (
    <Card className="gap-5 p-5">
      <div className="flex items-start gap-3">
        <Avatar className="size-12">
          {node.image && <AvatarImage src={node.image} alt="" />}
          <AvatarFallback className="bg-navy font-semibold text-white">
            {initials(node.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-navy">{node.name}</h3>
          <p className="truncate text-sm text-muted-foreground">{node.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <LevelBadge name={node.levelName} color={node.levelColor} />
            <AgentStatusBadge status={node.status} />
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Tutup" className="hidden xl:inline-flex">
          <X />
        </Button>
      </div>

      <dl className="grid gap-2.5 text-sm">
        <Row label="Sponsor">{sponsorName ?? "Kerjalin (langsung)"}</Row>
        <Row label="Tingkat">Tingkat {node.depth}</Row>
        <Row label="Kode referral">
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-[0.8125rem] font-semibold text-navy hover:bg-accent"
          >
            {node.referralCode} <Copy className="size-3" />
          </button>
        </Row>
        {node.phone && (
          <Row label="WhatsApp">
            <a
              href={`https://wa.me/${node.phone.replace(/^0/, "62")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-navy underline underline-offset-2"
            >
              <Phone className="size-3.5" /> {node.phone}
            </a>
          </Row>
        )}
      </dl>

      <div className="grid gap-2 rounded-lg bg-muted/70 p-3.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-navy">Slot downline langsung</span>
          <span className="font-bold text-navy tabular-nums">
            {node.directCount}/{node.slots ?? "∞"}
          </span>
        </div>
        {node.slots !== null && <Progress value={slotPct} className="h-2" />}
        <p className="text-xs text-muted-foreground">
          Total tim di bawahnya: <strong className="text-navy">{teamSize}</strong> agen
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Total komisi</p>
          <p className="mt-0.5 text-sm font-semibold text-navy tabular-nums">{formatIDR(node.earned)}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className="mt-0.5 text-sm font-semibold text-navy tabular-nums">{formatIDR(node.balance)}</p>
        </div>
      </div>

      <div className="grid gap-2">
        <Button asChild>
          <Link href={`/admin/agen/${node.id}`}>
            <ExternalLink /> Buka detail agen
          </Link>
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <AddAgentDialog
            nodes={nodes}
            levels={levels}
            defaultParentId={node.id}
            trigger={
              <Button variant="outline">
                <UserPlus /> Sub-agen
              </Button>
            }
          />
          <EditAgentDialog
            agent={{
              id: node.id,
              name: node.name,
              levelId: node.levelId,
              status: node.status,
              maxDownlinesOverride: node.maxDownlinesOverride,
              commissionPercentOverride: node.commissionPercentOverride,
              adminNotes: node.adminNotes,
              levelSlots: node.levelSlots,
              levelCommission: node.levelCommission,
            }}
            levels={levels}
            trigger={
              <Button variant="outline">
                <Settings2 /> Atur
              </Button>
            }
          />
          <MoveAgentDialog
            agent={{ id: node.id, name: node.name, parentId: node.parentId, levelId: node.levelId }}
            nodes={nodes}
            levels={levels}
            trigger={
              <Button variant="outline">
                <ArrowRightLeft /> Pindahkan
              </Button>
            }
          />
          <AgentStatusButton id={node.id} status={node.status} size="default" />
        </div>
      </div>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-navy">{children}</dd>
    </div>
  );
}
