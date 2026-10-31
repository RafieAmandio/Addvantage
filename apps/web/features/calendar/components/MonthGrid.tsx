"use client";

import type { CalendarEvent } from "@/features/calendar/types";
import { cn } from "@/lib/cn";
import { monthGridDays, startOfMonth, wibYmd, ymdToDate } from "@/features/calendar/lib/date";
import { formatDayHeader, shortName } from "@/features/calendar/lib/format";
import { IMPACT_DOT, MAX_EVENTS_IN_CELL } from "@/features/calendar/lib/style";
import { TODAY_YMD } from "@/features/calendar/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthGrid({
  anchor,
  events,
  onPickDay,
}: {
  anchor: string;
  events: CalendarEvent[];
  onPickDay: (ymd: string) => void;
}) {
  const days = monthGridDays(anchor);
  const monthPrefix = startOfMonth(anchor).slice(0, 7);

  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const ymd = wibYmd(e.ts);
    byDay.set(ymd, [...(byDay.get(ymd) ?? []), e]);
  }
  for (const [, list] of byDay) list.sort((a, b) => a.ts.localeCompare(b.ts));

  return (
    <div>
      <div className="grid grid-cols-7 pb-2">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40 sm:px-2">
            <span className="sm:hidden">{w[0]}</span>
            <span className="hidden sm:inline">{w}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((ymd) => {
          const inMonth = ymd.slice(0, 7) === monthPrefix;
          const isToday = ymd === TODAY_YMD;
          const isAnchor = ymd === anchor;
          const dayEvents = byDay.get(ymd) ?? [];
          const overflow = Math.max(0, dayEvents.length - MAX_EVENTS_IN_CELL);
          return (
            <button
              key={ymd}
              type="button"
              onClick={() => onPickDay(ymd)}
              title={`${formatDayHeader(ymd)}: open day view`}
              className={cn(
                "flex min-h-[64px] flex-col rounded-lg p-1.5 text-left transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand sm:min-h-[104px] sm:p-2",
                inMonth ? "bg-white/[0.03]" : "opacity-40",
                isAnchor && "ring-1 ring-inset ring-white/30",
              )}
            >
              <div className="flex items-baseline justify-between">
                <span className={cn("font-num text-[16px] font-semibold leading-5", isToday ? "text-brand" : inMonth ? "text-white" : "text-white/50")}>
                  {ymdToDate(ymd).getUTCDate()}
                </span>
                {dayEvents.length > 0 && <span className="hidden text-[11px] text-white/30 sm:inline">{dayEvents.length}</span>}
              </div>
              {/* Phone: one dot per event, coloured by impact */}
              <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                {dayEvents.slice(0, 8).map((e) => (
                  <span key={e.id} className={cn("h-1.5 w-1.5 rounded-full", IMPACT_DOT[e.impact])} />
                ))}
              </div>
              <div className="mt-1 hidden flex-1 space-y-0.5 sm:block">
                {dayEvents.slice(0, MAX_EVENTS_IN_CELL).map((e) => (
                  <div key={e.id} className="flex items-center gap-1.5 overflow-hidden" title={e.title}>
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", IMPACT_DOT[e.impact])} />
                    <span className="truncate text-[12px] text-white/70">{shortName(e.title.split(" — ").pop() ?? e.title)}</span>
                  </div>
                ))}
                {overflow > 0 && <div className="text-[11px] text-white/40">+{overflow} more</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
