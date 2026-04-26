import type { TradingPlan, TradingSetup } from "@/features/plan/types";
import type { WatchArchiveEntry } from "@/features/dashboard/types";

interface NewsWithAffects {
  affects: string[];
}

export function filterNewsByWatch<T extends NewsWithAffects>(
  items: T[],
  tickers: string[]
): T[] {
  return items.filter((n) => n.affects.some((a) => tickers.includes(a)));
}

export function filterSetupsByWatch(
  setups: TradingSetup[],
  tickers: string[]
): TradingSetup[] {
  return setups.filter((s) => tickers.includes(s.instrument));
}

export function collectWatchArchiveSetups(
  plans: TradingPlan[],
  tickers: string[],
  livePlanId: string,
  limit = 6
): WatchArchiveEntry[] {
  return plans
    .filter((p) => p.id !== livePlanId)
    .flatMap((p) =>
      p.setups
        .filter((s) => tickers.includes(s.instrument))
        .map((s) => ({ plan: p, setup: s }))
    )
    .slice(0, limit);
}
