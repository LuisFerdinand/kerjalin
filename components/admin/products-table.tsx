"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy, ExternalLink, ImageIcon, Loader2, MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductStatusBadge } from "@/components/app/badges";
import {
  bulkProductsAction,
  deleteProductAction,
  duplicateProductAction,
  setProductStatusAction,
} from "@/app/admin/produk/actions";
import { formatDate, formatIDR } from "@/lib/format";
import type { ProductStatus } from "@/db/schema";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  imageUrl: string | null;
  categoryName: string | null;
  status: ProductStatus;
  priceMonthly: number;
  planCount: number;
  sold: number;
  revenue: number;
  updatedAt: string;
  featured: boolean;
  badge: string | null;
};

export function ProductsTable({ rows }: { rows: ProductRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<{ ids: string[]; label: string } | null>(null);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function run(fn: () => Promise<{ ok: boolean; message?: string; error?: string } | null | void>) {
    startTransition(async () => {
      const res = await fn();
      if (res && "ok" in res) {
        if (res.ok) {
          toast.success(res.message);
          setSelected(new Set());
        } else toast.error(res.error ?? "Terjadi kesalahan");
      }
    });
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/60 px-4 py-2.5">
          <p className="text-sm font-medium text-navy">{selected.size} produk dipilih</p>
          <Select
            onValueChange={(status) =>
              run(() => bulkProductsAction({ ids: [...selected], op: "status", status: status as ProductStatus }))
            }
          >
            <SelectTrigger className="h-8 w-44 bg-card text-[0.8125rem]" aria-label="Ubah status produk terpilih">
              <SelectValue placeholder="Ubah status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Jadikan Aktif</SelectItem>
              <SelectItem value="coming_soon">Jadikan Segera hadir</SelectItem>
              <SelectItem value="draft">Jadikan Draf</SelectItem>
              <SelectItem value="archived">Arsipkan</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="text-negative hover:text-negative"
            onClick={() => setConfirm({ ids: [...selected], label: `${selected.size} produk terpilih` })}
          >
            <Trash2 /> Hapus
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Batal pilih
          </Button>
          {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 pl-5">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => setSelected(v ? new Set(rows.map((r) => r.id)) : new Set())}
                  aria-label="Pilih semua produk di halaman ini"
                />
              </TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Harga / bulan</TableHead>
              <TableHead className="text-right">Paket</TableHead>
              <TableHead className="text-right">Terjual</TableHead>
              <TableHead>Diubah</TableHead>
              <TableHead className="w-12 pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const isPublic = r.status === "active" || r.status === "coming_soon";
              return (
                <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined}>
                  <TableCell className="pl-5">
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={() => toggle(r.id)}
                      aria-label={`Pilih ${r.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/produk/${r.id}`} className="flex items-center gap-3">
                      <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                        {r.imageUrl ? (
                          <Image src={r.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <ImageIcon className="size-5 text-faint" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[0.9375rem] font-semibold text-navy hover:underline">{r.name}</span>
                          {r.featured && <Star className="size-3.5 shrink-0 fill-warning text-warning" aria-label="Produk unggulan" />}
                        </span>
                        <span className="block truncate text-[0.8125rem] text-muted-foreground">
                          {[r.categoryName ?? "Tanpa kategori", r.sku].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ProductStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-navy">{formatIDR(r.priceMonthly)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {r.planCount > 0 ? r.planCount : <span className="text-faint">-</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className="block font-medium text-navy">{r.sold}</span>
                    <span className="block text-[0.8125rem] text-muted-foreground">{r.revenue ? formatIDR(r.revenue) : "-"}</span>
                  </TableCell>
                  <TableCell className="text-[0.8125rem] text-muted-foreground">{formatDate(r.updatedAt)}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Menu ${r.name}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/produk/${r.id}`}>
                            <Pencil /> Ubah produk
                          </Link>
                        </DropdownMenuItem>
                        {isPublic && (
                          <DropdownMenuItem asChild>
                            <Link href={`/produk/${r.slug}`} target="_blank">
                              <ExternalLink /> Lihat di situs
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => run(() => duplicateProductAction(r.id))}>
                          <Copy /> Duplikat
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {r.status !== "active" && (
                          <DropdownMenuItem onSelect={() => run(() => setProductStatusAction(r.id, "active"))}>
                            Jadikan Aktif
                          </DropdownMenuItem>
                        )}
                        {r.status !== "archived" && (
                          <DropdownMenuItem onSelect={() => run(() => setProductStatusAction(r.id, "archived"))}>
                            Arsipkan
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setConfirm({ ids: [r.id], label: `“${r.name}”` })}>
                          <Trash2 /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {confirm?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Produk hilang dari situs dan katalog agen. Riwayat pesanan tetap tersimpan. Untuk menyembunyikan sementara,
              ubah statusnya menjadi Draf atau Arsipkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const ids = confirm?.ids ?? [];
                setConfirm(null);
                run(() => (ids.length === 1 ? deleteProductAction(ids[0]) : bulkProductsAction({ ids, op: "delete" })));
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
