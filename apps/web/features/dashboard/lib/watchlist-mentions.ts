import type { NewsItem, TradingPlan, TradingSetup } from "@/lib/mock/types";
import type { WatchArchiveEntry } from "@/features/dashboard/types";

/**
 * News items whose `affects` intersect the pinned tickers.
 */
export function filterNewsByWatch(
  items: NewsItem[],
  tickers: string[]
): NewsItem[] {
  return items.filter((n) => n.affects.some((a) => tickers.includes(a)));
}

/**
 * Live setups from the current plan that target a watched instrument.
 */
export function filterSetupsByWatch(
  setups: TradingSetup[],
  tickers: string[]
): TradingSetup[] {
  return setups.filter((s) => tickers.includes(s.instrument));
}

/**
 * Flatten every archived plan's setups down to the ones on watched tickers,
 * skip the currently-live plan, cap to `limit` for UI density.
 */
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
