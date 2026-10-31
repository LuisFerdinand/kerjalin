import { benefits } from "@/lib/content";
import { Reveal } from "./reveal";

export function BenefitStrip() {
  return (
    <section aria-label="Keunggulan Kerjalin" className="relative z-10 -mt-8 px-4 sm:px-6">
      <Reveal>
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-2xl border bg-border shadow-xl shadow-navy/5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3.5 bg-card p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-navy">{title}</h3>
                <p className="mt-0.5 text-[0.82rem] leading-snug text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
