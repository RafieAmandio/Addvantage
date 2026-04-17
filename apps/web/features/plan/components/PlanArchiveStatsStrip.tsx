import type { TradingPlan } from "@/lib/mock/types";
import { cn, formatDate } from "@/lib/cn";

type Props = {
  plansCount: number;
  closedCount: number;
  aggregateR: number;
  latest: TradingPlan;
  className?: string;
};

export function PlanArchiveStatsStrip({
  plansCount,
  closedCount,
  aggregateR,
  latest,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mb-6 grid grid-cols-1 gap-px bg-ink-3 sm:grid-cols-4",
        className
      )}
    >
      <div className="bg-ink p-5">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
          Plans on record
        </div>
        <div className="mt-1 font-display text-3xl text-paper">
          {plansCount}
        </div>
      </div>
      <div className="bg-ink p-5">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
          Latest
        </div>
        <div className="mt-1 font-display text-3xl text-lime">
          {latest.id.replace(/^TP-/, "")}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
          {formatDate(latest.date)}
        </div>
      </div>
      <div className="bg-ink p-5">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
          Closed plans
        </div>
        <div className="mt-1 font-display text-3xl text-paper">
          {closedCount}
        </div>
      </div>
      <div className="bg-ink p-5">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
          Aggregate R · closed
        </div>
        <div
          className={
            "mt-1 font-display text-3xl " +
            (aggregateR > 0
              ? "text-moss"
              : aggregateR < 0
              ? "text-blood"
              : "text-paper")
          }
        >
          {(aggregateR >= 0 ? "+" : "") + aggregateR.toFixed(1)}R
        </div>
      </div>
    </div>
  );
}
