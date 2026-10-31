"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation } from "motion/react";
import * as m from "motion/react-m";

/** Animasi muncul saat di-scroll. Memakai LazyMotion agar bundel tetap kecil. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  immediate = false,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  /** true = animasikan saat dimuat (untuk bagian atas halaman). */
  immediate?: boolean;
}) {
  const visible = { opacity: 1, y: 0 };
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={className}
        initial={{ opacity: 0, y }}
        {...(immediate
          ? { animate: visible }
          : { whileInView: visible, viewport: { once: true, margin: "-60px" } })}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
