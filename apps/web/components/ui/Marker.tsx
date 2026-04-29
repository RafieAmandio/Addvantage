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
        "flex items-baseline gap-2 text-sm",
        className
      )}
    >
      <span className="font-bold text-brand">{n}</span>
      <span className="text-white/20">/</span>
      <span className="text-white/50">{label}</span>
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
        "text-xs text-white/40",
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
    high: "border-brand/40 text-brand bg-brand/[0.08]",
    medium: "border-white/20 text-white/60 bg-white/[0.04]",
    low: "border-white/10 text-white/40 bg-transparent",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        styles[level]
      )}
    >
      {level === "high" && <span className="led" aria-hidden />}
      {level}
    </span>
  );
}

export function BiasBadge({
  bias,
}: {
  bias: "bullish" | "bearish" | "neutral";
}) {
  const styles = {
    bullish: "text-moss border-moss/30 bg-moss/[0.06]",
    bearish: "text-brand border-brand/30 bg-brand/[0.06]",
    neutral: "text-white/50 border-white/10 bg-white/[0.03]",
  } as const;
  const arrow = { bullish: "▲", bearish: "▼", neutral: "•" } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        styles[bias]
      )}
    >
      <span>{arrow[bias]}</span>
      {bias}
    </span>
  );
}
