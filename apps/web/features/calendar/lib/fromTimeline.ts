import type { CalendarEvent } from "@/features/calendar/types";
import type { TimelineEvent } from "@/features/timeline/types";

const REGION_MAP: Record<string, CalendarEvent["region"]> = {
  US: "US", EU: "EU", UK: "UK", JP: "JP", CN: "CN", ID: "ID",
  AU: "GLOBAL", CA: "GLOBAL", IN: "GLOBAL", DE: "EU",
};

function symbolToRegion(sym: string | undefined): CalendarEvent["region"] {
  if (!sym) return "GLOBAL";
  return REGION_MAP[sym.toUpperCase()] ?? "GLOBAL";
}

// Display map: country/region code → its real currency. Used to relabel the
// event title prefix (worker builds titles as "${country} — ${event}") so the
// left column reads "JPY — …" instead of "JP — …". Distinct from any scoring
// map — here we want the actual currency (e.g. CN → CNY, not USD).
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", EU: "EUR", DE: "EUR", UK: "GBP", GB: "GBP", JP: "JPY",
  CN: "CNY", ID: "IDR", AU: "AUD", CA: "CAD", IN: "INR", CH: "CHF", NZ: "NZD",
};

function relabelTitle(title: string, symbol: string | undefined): string {
  const code = (symbol ?? "").toUpperCase();
  const cur = COUNTRY_TO_CURRENCY[code];
  // Only swap when the title actually starts with the country prefix; otherwise
  // leave it untouched (safe no-op for titles without a recognized prefix).
  if (cur && title.toUpperCase().startsWith(`${code} — `)) {
    return cur + title.slice(code.length); // "JP — x" → "JPY" + " — x"
  }
  return title;
}

export function timelineEventToCalendarEvent(
  row: TimelineEvent
): CalendarEvent {
  const region = symbolToRegion(row.symbols[0]);
  const meta = (row.metadata ?? {}) as Record<string, unknown>;

  return {
    id: row.id,
    ts: row.occurredAt,
    region,
    title: relabelTitle(row.title, row.symbols[0]),
    impact: row.impact ?? "low",
    ...(meta.actual ? { actual: String(meta.actual) } : {}),
    ...(meta.previous ? { previous: String(meta.previous) } : {}),
    ...(meta.consensus ? { consensus: String(meta.consensus) } : {}),
    ...(meta.forecast ? { forecast: String(meta.forecast) } : {}),
    ...(row.body ? { notes: row.body } : {}),
    ...(row.newsItemId ? { relatedNewsId: row.newsItemId } : {}),
  };
}
