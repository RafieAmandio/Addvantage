import { news } from "@/features/news/mock";
import { getAllPlans } from "@/features/plan/mock";
import { calendar, CURRENCIES } from "@/features/calendar/mock";
import type { CalendarEvent, TradingPlan, TradingSetup } from "@/lib/mock/types";
import type { TickerRollup } from "@/features/watchlist/types";

export function calendarEventsFor(ticker: string): CalendarEvent[] {
  const t = ticker.toUpperCase();
  const currencyIdx = (CURRENCIES as ReadonlyArray<string>).indexOf(t);
  return calendar.filter((e) => {
    if (currencyIdx >= 0 && e.scores[currencyIdx] >= 5) return true;
    if (e.notes && e.notes.toUpperCase().includes(t)) return true;
    if (e.title.toUpperCase().includes(t)) return true;
    return false;
  });
}

export function rollupTicker(ticker: string, latestId: string): TickerRollup {
  const newsItems = news.filter((n) => n.affects.includes(ticker));
  const allPlans = getAllPlans();

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
    calendarEvents: calendarEventsFor(ticker),
    totalR,
    closedCount,
  };
}
