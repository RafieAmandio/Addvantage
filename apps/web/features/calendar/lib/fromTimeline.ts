import type { CalendarEvent, CurrencyScores } from "@/lib/mock/types";
import type { TimelineEvent } from "@/features/timeline/types";

function symbolToRegion(sym: string | undefined): CalendarEvent["region"] {
  if (!sym) return "GLOBAL";
  const s = sym.toUpperCase();
  switch (s) {
    case "USD":
      return "US";
    case "EUR":
      return "EU";
    case "GBP":
      return "UK";
    case "JPY":
      return "JP";
    case "CNY":
    case "CNH":
      return "CN";
    case "IDR":
      return "ID";
    case "US":
    case "EU":
    case "UK":
    case "JP":
    case "CN":
    case "ID":
    case "GLOBAL":
      return s as CalendarEvent["region"];
    default:
      return "GLOBAL";
  }
}

const NO_SCORES: CurrencyScores = [0, 0, 0, 0, 0, 0, 0];

export function timelineEventToCalendarEvent(
  row: TimelineEvent
): CalendarEvent {
  return {
    id: row.id,
    ts: row.occurred_at,
    region: symbolToRegion(row.symbols[0]),
    title: row.title,
    impact: row.impact ?? "low",
    scores: NO_SCORES,
    ...(row.body ? { notes: row.body } : {}),
    ...(row.news_item_id ? { relatedNewsId: row.news_item_id } : {}),
  };
}
