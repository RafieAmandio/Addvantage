import type { CalendarEvent, CurrencyScores } from "@/features/calendar/types";
import { CURRENCIES } from "@/features/calendar/types";
import type { TimelineEvent } from "@/features/timeline/types";

const REGION_MAP: Record<string, CalendarEvent["region"]> = {
  US: "US", EU: "EU", UK: "UK", JP: "JP", CN: "CN", ID: "ID",
  AU: "GLOBAL", CA: "GLOBAL", IN: "GLOBAL", DE: "EU",
};

function symbolToRegion(sym: string | undefined): CalendarEvent["region"] {
  if (!sym) return "GLOBAL";
  return REGION_MAP[sym.toUpperCase()] ?? "GLOBAL";
}

const IMPACT_SCORE: Record<string, number> = { high: 9, medium: 5, low: 2 };

const CURRENCY_INDEX: Record<string, number> = {};
for (let i = 0; i < CURRENCIES.length; i++) {
  CURRENCY_INDEX[CURRENCIES[i]] = i;
}

// Also map common symbol names to their currency
const SYMBOL_TO_CURRENCY: Record<string, string> = {
  USD: "USD", DXY: "USD", SPX: "USD", US: "USD",
  EUR: "EUR", EURUSD: "EUR", DE: "EUR",
  GBP: "GBP", GBPUSD: "GBP", UK: "GBP",
  JPY: "JPY", USDJPY: "JPY", JP: "JPY",
  CHF: "CHF", USDCHF: "CHF",
  CAD: "CAD", USDCAD: "CAD", CA: "CAD",
  AUD: "AUD", AUDUSD: "AUD", AU: "AUD",
  CNY: "USD", GOLD: "USD", BTC: "USD",
};

function deriveScores(symbols: string[], impact: string | null): CurrencyScores {
  const scores: CurrencyScores = [0, 0, 0, 0, 0, 0, 0];
  const score = IMPACT_SCORE[impact ?? "low"] ?? 2;

  for (const sym of symbols) {
    const currency = SYMBOL_TO_CURRENCY[sym.toUpperCase()];
    if (currency) {
      const idx = CURRENCY_INDEX[currency];
      if (idx !== undefined && score > scores[idx]) {
        scores[idx] = score;
      }
    }
  }

  // If no currency matched, assign to USD as default
  if (scores.every((s) => s === 0) && symbols.length > 0) {
    scores[0] = score;
  }

  return scores;
}

export function timelineEventToCalendarEvent(
  row: TimelineEvent
): CalendarEvent {
  const region = symbolToRegion(row.symbols[0]);
  const scores = deriveScores(row.symbols, row.impact);

  return {
    id: row.id,
    ts: row.occurredAt,
    region,
    title: row.title,
    impact: row.impact ?? "low",
    scores,
    ...(row.body ? { notes: row.body } : {}),
    ...(row.newsItemId ? { relatedNewsId: row.newsItemId } : {}),
  };
}
