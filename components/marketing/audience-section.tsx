import Image from "next/image";
import { audiences } from "@/lib/content";
import { Reveal } from "./reveal";

export function AudienceSection() {
  return (
    <section className="bg-cream/60 py-20 lg:py-28" aria-labelledby="untuk-siapa">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-widest text-brand uppercase">Untuk siapa?</p>
          <h2 id="untuk-siapa" className="mt-3 text-3xl font-extrabold text-balance text-navy sm:text-4xl">
            Peluang untuk semua orang
          </h2>
          <p className="mt-4 text-lg text-navy/70">
            Tidak perlu latar belakang khusus. Kalau kamu punya ponsel, koneksi internet, dan
            semangat belajar, kamu bisa mulai.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map(({ icon: Icon, title, text, image }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <article className="group relative h-full overflow-hidden rounded-2xl bg-navy">
                <Image
                  src={image}
                  alt=""
                  width={600}
                  height={480}
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw"
                  className="aspect-[5/4] w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand shadow-lg shadow-brand/30">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="text-base font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-snug text-cream/75">{text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
