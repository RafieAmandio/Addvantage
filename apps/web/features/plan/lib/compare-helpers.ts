import type { TradingPlan } from "@/features/plan/types";
import {
  computePlanOutcome,
  type PlanOutcomeDigest,
} from "@/features/plan/lib/detail-helpers";

export function commonInstruments(
  planA: TradingPlan,
  planB: TradingPlan
): string[] {
  const aInstr = new Set(planA.setups.map((s) => s.instrument));
  const bInstr = new Set(planB.setups.map((s) => s.instrument));
  return [...bInstr].filter((i) => aInstr.has(i));
}

export type CompareSummary = {
  outcomeA: PlanOutcomeDigest | null;
  outcomeB: PlanOutcomeDigest | null;
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
