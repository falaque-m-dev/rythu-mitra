import { cn } from "@/lib/utils";

interface SpotlightProps {
  className?: string;
}

export function Spotlight({ className }: SpotlightProps) {
  return (
    <svg
      className={cn(
        "pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[640px] -translate-x-1/2 opacity-40 blur-3xl",
        className
      )}
      viewBox="0 0 640 420"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="spotlight-gradient" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
          <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.12" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="320" cy="0" rx="320" ry="220" fill="url(#spotlight-gradient)" />
    </svg>
  );
}
