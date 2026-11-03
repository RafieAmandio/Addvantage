import type { TradingPlan } from "@/features/plan/types";
import { cn, formatDate } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { rTone } from "@/features/plan/lib/detail-helpers";

type Props = {
  plansCount: number;
  closedCount: number;
  aggregateR: number;
  latest: TradingPlan;
  className?: string;
};

const EYEBROW = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

export function PlanArchiveStatsStrip({ plansCount, closedCount, aggregateR, latest, className }: Props) {
  return (
    <Panel title="Performance" sub={`Latest ${latest.id} · ${formatDate(latest.date)}`} className={className}>
      <p className={EYEBROW}>Realised R · closed</p>
      <p className={cn("font-num text-[52px] font-semibold leading-[56px]", closedCount ? rTone(aggregateR) : "text-white/30")}>
        {closedCount ? `${aggregateR >= 0 ? "+" : ""}${aggregateR.toFixed(1)}R` : "n/a"}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className={EYEBROW}>Plans</p>
          <p className="font-num text-[28px] font-semibold leading-8 text-white">{plansCount}</p>
        </div>
        <div>
          <p className={EYEBROW}>Closed</p>
          <p className="font-num text-[28px] font-semibold leading-8 text-white">{closedCount}</p>
        </div>
      </div>
    </Panel>
  );
}
