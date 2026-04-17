import type { TradingPlan } from "@/lib/mock/types";
import { computePlanOutcome } from "@/features/plan/mock";

/**
 * Instruments that appear in both plans. Preserves the order they appear
 * in `planB` — matches the visual order of Plan B's setup list.
 */
export function commonInstruments(
  planA: TradingPlan,
  planB: TradingPlan
): string[] {
  const aInstr = new Set(planA.setups.map((s) => s.instrument));
  return planB.setups
    .map((s) => s.instrument)
    .filter((i) => aInstr.has(i));
}

export type CompareSummary = {
  outcomeA: ReturnType<typeof computePlanOutcome>;
  outcomeB: ReturnType<typeof computePlanOutcome>;
  bothClosed: boolean;
  deltaR: number | null;
};

export function computeCompareSummary(
  planA: TradingPlan,
  planB: TradingPlan
): CompareSummary {
  const outcomeA = computePlanOutcome(planA);
  const outcomeB = computePlanOutcome(planB);
  const bothClosed = Boolean(outcomeA && outcomeB);
  const deltaR =
    outcomeA && outcomeB ? outcomeA.totalR - outcomeB.totalR : null;
  return { outcomeA, outcomeB, bothClosed, deltaR };
}
