import { cn } from "@/lib/cn";

export function SectionNumber({
  n,
  label,
  className,
}: {
  n: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-widest2 text-lime",
        className
      )}
    >
      <span className="text-lime">{n}</span>
      <span className="h-px flex-1 bg-lime/30" />
      <span className="text-paper/60">{label}</span>
    </div>
  );
}

export function DataLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] uppercase tracking-widest2 text-paper/50",
        className
      )}
    >
      {children}
    </span>
  );
}

export function ImpactPill({
  level,
}: {
  level: "high" | "medium" | "low";
}) {
  const styles = {
    high: "border-lime/60 text-lime bg-lime/5",
    medium: "border-paper/30 text-paper/70 bg-paper/5",
    low: "border-steel/40 text-steel bg-transparent",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2",
        styles[level]
      )}
    >
      {level === "high" && <span className="led lime" />}
      {level} impact
    </span>
  );
}

export function BiasBadge({
  bias,
}: {
  bias: "bullish" | "bearish" | "neutral";
}) {
  const styles = {
    bullish: "text-moss border-moss/40",
    bearish: "text-lime border-lime/60",
    neutral: "text-paper/50 border-paper/20",
  } as const;
  const arrow = { bullish: "▲", bearish: "▼", neutral: "•" } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2",
        styles[bias]
      )}
    >
      <span>{arrow[bias]}</span>
      {bias}
    </span>
  );
}
