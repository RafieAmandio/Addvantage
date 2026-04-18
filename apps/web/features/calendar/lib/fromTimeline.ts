import type { CalendarEvent, CurrencyScores } from "@/lib/mock/types";
import type { TimelineEvent } from "@/features/timeline/types";

/**
 * Map the first symbol on a `timeline_events` macro row (a currency or
 * country code set by the FF adapter via `news_items.affects[]`) to the
 * region code the calendar UI expects. Falls back to "GLOBAL" when the
 * row has no symbols or the first symbol isn't recognised.
 */
function symbolToRegion(sym: string | undefined): CalendarEvent["region"] {
  if (!sym) return "GLOBAL";
  const s = sym.toUpperCase();
  // Currency → region. FF feeds use currency codes (USD, EUR, …).
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
    // Non-currency region codes that may appear in symbols[] directly.
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

/** Zeroed per-currency impact tuple; the FF feed doesn't ship these. */
const NO_SCORES: CurrencyScores = [0, 0, 0, 0, 0, 0, 0];

/**
 * Project a `timeline_events` row (`kind='macro'`) into the `CalendarEvent`
 * shape that `CalendarPageView` renders. Lossy by design — the FF feed
 * doesn't carry `forecast`/`previous`/per-currency `scores`, and the
 * editorial body replaces the raw feed's `notes`. The view handles the
 * absence of these fields gracefully.
 */
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
