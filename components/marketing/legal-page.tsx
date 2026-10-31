import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
      <h1 className="text-4xl font-extrabold text-balance text-navy">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Terakhir diperbarui: {updated}</p>
      <div className="mt-10 grid gap-8 text-base leading-relaxed text-navy/80 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy [&_li]:ml-5 [&_li]:list-disc [&_ul]:grid [&_ul]:gap-1.5">
        {children}
      </div>
    </article>
  );
}
