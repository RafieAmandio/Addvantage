import type { CalendarEvent } from "@/lib/mock/types";
import { calendarDayMeta } from "@/features/calendar/mock";
import { wibYmd } from "./date";
import { shortName } from "./format";

export function deriveSummary(events: CalendarEvent[]): string {
  const ymd = wibYmd(events[0].ts);
  const curated = calendarDayMeta.find((m) => m.date === ymd);
  if (curated) return curated.summary;
  const highs = events.filter((e) => e.impact === "high");
  if (highs.length > 0) {
    return highs.slice(0, 3).map((e) => shortName(e.title)).join(" + ");
  }
  return `${events.length} ${events.length === 1 ? "event" : "events"}`;
}

export function groupByDay(
  events: CalendarEvent[]
): Array<{ ymd: string; events: CalendarEvent[] }> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const ymd = wibYmd(e.ts);
    const list = map.get(ymd) ?? [];
    list.push(e);
    map.set(ymd, list);
  }
  return Array.from(map.entries())
    .map(([ymd, events]) => ({
      ymd,
      events: events.sort((a, b) => a.ts.localeCompare(b.ts)),
    }))
    .sort((a, b) => a.ymd.localeCompare(b.ymd));
}
