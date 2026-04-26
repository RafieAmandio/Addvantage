import type { TradingPlan } from "@/features/plan/types";
import { computePlanOutcome } from "@/features/plan/mock";
import type { HorizonRBreakdown } from "@/features/plan/types";

export function aggregateR(plans: TradingPlan[]): number {
  return plans.reduce((acc, p) => {
    const o = computePlanOutcome(p);
    return o ? acc + o.totalR : acc;
  }, 0);
}

export function monthTotalR(
  plans: TradingPlan[],
  latestId: string
): number {
  return aggregateR(plans.filter((p) => p.id !== latestId));
}

export function horizonBreakdown(closed: TradingPlan[]): HorizonRBreakdown {
  const acc: HorizonRBreakdown = {
    intraday: { r: 0, n: 0 },
    swing: { r: 0, n: 0 },
    weekly: { r: 0, n: 0 },
  };
  for (const p of closed) {
    const o = computePlanOutcome(p);
    if (o) {
      acc[p.horizon].r += o.totalR;
      acc[p.horizon].n += 1;
    }
  }
  return acc;
}
