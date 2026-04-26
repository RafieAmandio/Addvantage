import type { TradingPlan, TradingSetup } from "@/features/plan/types";
import type { NewsListItem } from "@/features/news/queries/news";
import type { TickerRollup } from "@/features/watchlist/types";

export function rollupTicker(
  ticker: string,
  latestId: string,
  allNews: NewsListItem[],
  allPlans: TradingPlan[],
): TickerRollup {
  const newsItems = allNews.filter((n) => n.affects.includes(ticker));

  const liveSetups: Array<{ plan: TradingPlan; setup: TradingSetup }> = [];
  const archiveSetups: Array<{ plan: TradingPlan; setup: TradingSetup }> = [];

  for (const p of allPlans) {
    for (const s of p.setups) {
      if (s.instrument !== ticker) continue;
      if (p.id === latestId) {
        liveSetups.push({ plan: p, setup: s });
      } else {
        archiveSetups.push({ plan: p, setup: s });
      }
    }
  }

  let totalR = 0;
  let closedCount = 0;
  for (const { setup } of archiveSetups) {
    if (setup.outcomeR) {
      const n = parseFloat(setup.outcomeR.replace(/R/i, ""));
      if (isFinite(n)) {
        totalR += n;
        closedCount += 1;
      }
    }
  }

  return {
    ticker,
    newsItems,
    liveSetups,
    archiveSetups,
    totalR,
    closedCount,
  };
}
