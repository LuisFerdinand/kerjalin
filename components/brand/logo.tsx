import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={cn("size-9 shrink-0", className)}
    >
      <rect width="100" height="100" rx="21" fill="#0B78F0" />
      <circle cx="30.5" cy="23.5" r="10.6" fill="#fff" />
      <path
        fill="#fff"
        d="M19.6 38.4C27.5 34.6 40.2 36.6 40.2 53.2V87C29.2 87.6 19.6 82 19.6 70.4V38.4Z"
      />
      <path
        fill="#fff"
        d="M43.4 46C43.4 42.4 45.2 40.2 48 38.5L76.2 20.4C78.7 18.9 81.5 19.8 81 23.4C79.8 34 72.4 41.6 51.4 54.2L77.4 74.6C80.6 77.1 81.5 82.8 78.6 87.2C62.6 88.6 43.4 79.4 43.4 62.6V46Z"
      />
    </svg>
  );
}

type LogoProps = {
  /** "light" dipakai di atas latar gelap (navy). */
  tone?: "default" | "light";
  tagline?: boolean;
  className?: string;
  markClassName?: string;
};

export function Logo({
  tone = "default",
  tagline = false,
  className,
  markClassName,
}: LogoProps) {
  const light = tone === "light";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[1.35rem] font-extrabold tracking-tight",
            light ? "text-white" : "text-navy",
          )}
        >
          Kerja<span className="text-brand">lin</span>
        </span>
        {tagline && (
          <span
            className={cn(
              "mt-1 text-[0.6rem] font-medium tracking-[0.28em] uppercase",
              light ? "text-cream/70" : "text-muted-foreground",
            )}
          >
            Peluang untuk semua
          </span>
        )}
      </span>
    </span>
  );
}
