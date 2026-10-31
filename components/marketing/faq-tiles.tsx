import { Plus } from "lucide-react";

/** Daftar pertanyaan. `<details name>` membuka satu pada satu waktu. */
export function FaqTiles({ items, group = "faq" }: { items: { q: string; a: string }[]; group?: string }) {
  return (
    <div className="grid gap-3">
      {items.map((f) => (
        <details
          key={f.q}
          name={group}
          className="group rounded-2xl border border-border bg-white text-navy shadow-card transition-colors open:border-navy"
        >
          <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 px-5 py-4 font-semibold sm:px-6 [&::-webkit-details-marker]:hidden">
            <span>{f.q}</span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted transition-colors group-open:bg-navy group-open:text-white">
              <Plus className="size-4 transition-transform duration-200 group-open:rotate-45" aria-hidden />
            </span>
          </summary>
          <p className="max-w-[62ch] px-5 pb-5 leading-relaxed text-muted-foreground sm:px-6">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
