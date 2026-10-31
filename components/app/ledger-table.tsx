import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WalletTypeBadge } from "@/components/app/badges";
import { formatDateTime, formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WalletEntry } from "@/db/schema";

export function LedgerTable({ rows, empty = "Belum ada transaksi." }: { rows: WalletEntry[]; empty?: string }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Tanggal</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead className="pr-5 text-right">Jumlah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          )}
          {rows.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="pl-5 text-sm whitespace-nowrap text-muted-foreground">
                {formatDateTime(e.createdAt)}
              </TableCell>
              <TableCell>
                <WalletTypeBadge type={e.type} />
              </TableCell>
              <TableCell className="max-w-xs text-sm">
                <span className="line-clamp-2">{e.description ?? "-"}</span>
              </TableCell>
              <TableCell
                className={cn(
                  "pr-5 text-right font-bold whitespace-nowrap tabular-nums",
                  e.amount >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {e.amount >= 0 ? "+" : "−"}
                {formatIDR(Math.abs(e.amount))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
