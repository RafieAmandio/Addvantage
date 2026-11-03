import { cn } from "@/lib/cn";

/** Section eyebrow. The number is kept faint for pages that still sequence sections. */
export function SectionNumber({ n, label, className }: { n: string; label: string; className?: string }) {
  return (
    <div className={cn("flex items-baseline gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]", className)}>
      <span className="text-white/25">{n.replace(/\s*\/\s*$/, "")}</span>
      <span className="text-white/55">{label}</span>
    </div>
  );
}

export function DataLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40", className)}>{children}</span>;
}

/** Impact as text: high is the one thing worth the brand colour. */
export function ImpactPill({ level }: { level: "high" | "medium" | "low" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-[12px] font-semibold uppercase tracking-[0.06em]",
        level === "high" ? "text-brand" : level === "medium" ? "text-white/55" : "text-white/30",
      )}
    >
      {level === "high" ? "High impact" : level}
    </span>
  );
}

/** Direction is green/red only, never brand. */
export function BiasBadge({ bias }: { bias: "bullish" | "bearish" | "neutral" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.06em]",
        bias === "bullish" ? "text-up" : bias === "bearish" ? "text-down" : "text-white/40",
      )}
    >
      {bias === "bullish" ? "▲ Bull" : bias === "bearish" ? "▼ Bear" : "Neutral"}
    </span>
  );
}
