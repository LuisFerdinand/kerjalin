import { faqs } from "@/lib/content";
import { FaqTiles } from "./faq-tiles";
import { Reveal } from "./reveal";

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 pb-16 lg:pb-24">
      <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16 lg:px-8">
        <Reveal>
          <div className="lg:sticky lg:top-28">
            <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] leading-tight font-extrabold text-balance text-navy">
              Pertanyaan yang Sering Muncul
            </h2>
            <p className="mt-3 max-w-[34ch] text-muted-foreground">
              Belum menemukan jawabannya? Daftar saja dulu, tim Kerjalin siap membantu setelah akunmu aktif.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <FaqTiles items={faqs} />
        </Reveal>
      </div>
    </section>
  );
}
