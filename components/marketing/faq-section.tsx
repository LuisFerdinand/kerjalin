import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqs } from "@/lib/content";
import { Reveal } from "./reveal";

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="text-sm font-bold tracking-widest text-brand uppercase">FAQ</p>
          <h2 className="mt-3 text-3xl font-extrabold text-balance text-navy sm:text-4xl">
            Pertanyaan yang sering ditanyakan
          </h2>
          <p className="mt-4 text-lg text-navy/70">
            Belum menemukan jawabannya? Hubungi kami lewat kontak di bagian bawah halaman.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="grid gap-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`faq-${i}`}
                className="rounded-2xl border bg-card px-5 data-[state=open]:shadow-md data-[state=open]:shadow-navy/5"
              >
                <AccordionTrigger className="py-4 text-left text-base font-semibold text-navy hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-base leading-relaxed text-navy/70">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
