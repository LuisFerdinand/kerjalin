import { cn } from "@/lib/utils";

/**
 * Slot downline langsung sebagai deretan kotak: terisi (navy) dan masih terbuka (kosong).
 * Unsur khas Kerjalin: batas jumlah agen yang boleh direkrut ditampilkan apa adanya.
 */
export function SlotStrip({
  used,
  slots,
  sponsor,
  nextLevel,
}: {
  used: number;
  slots: number | null;
  sponsor: string | null;
  nextLevel: string | null;
}) {
  const shown = slots === null ? Math.min(Math.max(used, 1) + 2, 12) : Math.min(slots, 20);
  return (
    <div className="grid gap-3 rounded-lg bg-muted/60 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-navy">Slot tim langsung</p>
        <p className="text-sm tabular-nums text-muted-foreground">
          <span className="font-semibold text-navy">{used}</span> dari {slots ?? "tanpa batas"} terpakai
        </p>
      </div>
      {shown > 0 ? (
        <div className="flex flex-wrap gap-1.5" role="img" aria-label={`${used} dari ${slots ?? "tanpa batas"} slot terpakai`}>
          {Array.from({ length: shown }).map((_, i) => (
            <span
              key={i}
              className={cn("size-5 rounded-[5px]", i < used ? "bg-navy" : "border border-input bg-card")}
            />
          ))}
          {slots === null && <span className="self-center pl-1 text-[0.8125rem] text-muted-foreground">dan seterusnya</span>}
        </div>
      ) : null}
      <p className="text-[0.8125rem] text-muted-foreground">
        Sponsor: <span className="font-medium text-navy">{sponsor ?? "Kerjalin (langsung)"}</span>
        {nextLevel && (
          <>
            {" · "}Rekrutan menjadi <span className="font-medium text-navy">{nextLevel}</span>
          </>
        )}
      </p>
    </div>
  );
}
