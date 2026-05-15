import type { CalendarEvent, CurrencyScores } from "@/features/calendar/types";
import type { TimelineEvent } from "@/features/timeline/types";

const REGION_MAP: Record<string, CalendarEvent["region"]> = {
  US: "US", EU: "EU", UK: "UK", JP: "JP", CN: "CN", ID: "ID",
  AU: "GLOBAL", CA: "GLOBAL", IN: "GLOBAL", DE: "EU",
};

function symbolToRegion(sym: string | undefined): CalendarEvent["region"] {
  if (!sym) return "GLOBAL";
  return REGION_MAP[sym.toUpperCase()] ?? "GLOBAL";
}

const NO_SCORES: CurrencyScores = [0, 0, 0, 0, 0, 0, 0];

export function timelineEventToCalendarEvent(
  row: TimelineEvent
): CalendarEvent {
  const meta = (row as { metadata?: Record<string, unknown> }).metadata;
  const metaScores = meta?.scores as number[] | undefined;
  const metaRegion = meta?.region as string | undefined;

  const scores: CurrencyScores = metaScores && metaScores.length === 7
    ? metaScores as CurrencyScores
    : NO_SCORES;

  const region = metaRegion
    ? (REGION_MAP[metaRegion] ?? symbolToRegion(row.symbols[0]))
    : symbolToRegion(row.symbols[0]);

  return {
    id: row.id,
    ts: row.occurred_at,
    region,
    title: row.title,
    impact: row.impact ?? "low",
    scores,
    ...(row.body ? { notes: row.body } : {}),
    ...(row.news_item_id ? { relatedNewsId: row.news_item_id } : {}),
  };
}
