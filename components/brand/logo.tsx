import { cn } from "@/lib/utils";

const GLYPH_DOT = { cx: 30.5, cy: 23.5, r: 10.6 };
const GLYPH_I = "M19.6 38.4C27.5 34.6 40.2 36.6 40.2 53.2V87C29.2 87.6 19.6 82 19.6 70.4V38.4Z";
const GLYPH_K =
  "M43.4 46C43.4 42.4 45.2 40.2 48 38.5L76.2 20.4C78.7 18.9 81.5 19.8 81 23.4C79.8 34 72.4 41.6 51.4 54.2L77.4 74.6C80.6 77.1 81.5 82.8 78.6 87.2C62.6 88.6 43.4 79.4 43.4 62.6V46Z";

/** Tanda "iK". `tone="navy"`: kotak navy, huruf putih. `tone="white"`: untuk latar navy. */
export function LogoMark({
  className,
  tone = "navy",
}: {
  className?: string;
  tone?: "navy" | "white";
}) {
  const box = tone === "navy" ? "#082052" : "#FFFFFF";
  const glyph = tone === "navy" ? "#FFFFFF" : "#082052";
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={cn("size-9 shrink-0", className)}>
      <rect width="100" height="100" rx="21" fill={box} />
      <circle {...GLYPH_DOT} fill={glyph} />
      <path fill={glyph} d={GLYPH_I} />
      <path fill={glyph} d={GLYPH_K} />
    </svg>
  );
}

type LogoProps = {
  /** "light" dipakai di atas latar navy. */
  tone?: "default" | "light";
  tagline?: boolean;
  className?: string;
  markClassName?: string;
};

export function Logo({ tone = "default", tagline = false, className, markClassName }: LogoProps) {
  const light = tone === "light";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark tone={light ? "white" : "navy"} className={markClassName} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[1.3rem] font-extrabold tracking-tight",
            light ? "text-white" : "text-navy",
          )}
        >
          Kerja<span className={light ? "text-white/70" : "text-[#5b6c99]"}>lin</span>
        </span>
        {tagline && (
          <span className={cn("mt-1 text-[0.8125rem] font-medium", light ? "text-white/75" : "text-muted-foreground")}>
            Peluang untuk semua
          </span>
        )}
      </span>
    </span>
  );
}
