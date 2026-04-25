import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Small numbered section header used across the dashboard surfaces
 * (e.g. "01 / Top of the wire · 3 most-impact items"). Kept internal to
 * the dashboard feature — if a second feature needs the same shape, promote
 * to `components/ui/`.
 */
export function SectionHeader({
  n,
  label,
  right,
  children,
  className,
}: {
  n: string;
  label: string;
  right?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-baseline justify-between gap-3", className)}
    >
      <div className="flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">
        <span>{n}</span>
        <span className="h-px w-6 bg-brand/30" />
        <span className="text-white/60">{label}</span>
        {right && <span className="text-white/30">· {right}</span>}
      </div>
      {children}
    </div>
  );
}
