import type { CalendarEvent } from "@/features/calendar/types";
import { wibYmd } from "./date";

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
      events: events.sort((a, b) => b.ts.localeCompare(a.ts)),
    }))
    .sort((a, b) => b.ymd.localeCompare(a.ymd)); // newest first
}
