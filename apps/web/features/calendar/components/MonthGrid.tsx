"use client";

import type { CalendarEvent } from "@/lib/mock/types";
import { cn } from "@/lib/cn";
import { monthGridDays, startOfMonth, wibYmd, ymdToDate } from "@/features/calendar/lib/date";
import { formatDayHeader, shortName } from "@/features/calendar/lib/format";
import { IMPACT_DOT, MAX_EVENTS_IN_CELL } from "@/features/calendar/lib/style";
import { DEMO_TODAY_YMD } from "@/features/calendar/types";

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
  const monthStart = startOfMonth(anchor);
  const monthPrefix = monthStart.slice(0, 7);

  // Events grouped by WIB day
  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const ymd = wibYmd(e.ts);
    const list = byDay.get(ymd) ?? [];
    list.push(e);
    byDay.set(ymd, list);
  }
  // Sort events inside each day by timestamp for consistent overflow
  for (const [, list] of byDay) {
    list.sort((a, b) => a.ts.localeCompare(b.ts));
  }

  const todayYmd = DEMO_TODAY_YMD;

  const weekdayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="border border-ink-3">
      {/* Weekday header row */}
      <div className="grid grid-cols-7 border-b-2 border-lime/40 bg-ink-2/95">
        {weekdayHeaders.map((w) => (
          <div
            key={w}
            className="px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest2 text-lime"
          >
            {w}
          </div>
        ))}
      </div>

      {/* 6 weeks × 7 days */}
      <div className="grid grid-cols-7">
        {days.map((ymd, i) => {
          const date = ymdToDate(ymd);
          const day = date.getUTCDate();
          const inMonth = ymd.slice(0, 7) === monthPrefix;
          const isToday = ymd === todayYmd;
          const isAnchor = ymd === anchor;
          const isWeekend = [5, 6].includes(i % 7);
          const dayEvents = byDay.get(ymd) ?? [];
          const overflow = Math.max(0, dayEvents.length - MAX_EVENTS_IN_CELL);

          return (
            <button
              key={ymd}
              onClick={() => onPickDay(ymd)}
              title={`${formatDayHeader(ymd)} — click to drill into day view`}
              className={cn(
                "group relative flex min-h-[110px] flex-col items-stretch border-b border-r border-ink-3 p-2 text-left transition-colors",
                i % 7 === 6 && "border-r-0",
                Math.floor(i / 7) === 5 && "border-b-0",
                inMonth
                  ? "bg-ink hover:bg-ink-2"
                  : "bg-ink-2/30 hover:bg-ink-2/60",
                // Non-anchor hover gets a faint lime preview outline
                !isAnchor && !isToday && "hover:ring-1 hover:ring-inset hover:ring-lime/30",
                // Anchor (keyboard cursor) — inset lime border, overridden
                // visually by the today ring below when they coincide.
                isAnchor && !isToday && "bg-lime/5 ring-2 ring-inset ring-lime/60",
                isToday && "ring-1 ring-inset ring-lime",
                isAnchor && isToday && "ring-2 ring-lime bg-lime/10"
              )}
            >
              {/* Day number */}
              <div className="flex items-baseline justify-between">
                <span
                  className={cn(
                    "font-mono text-[11px] font-semibold tracking-widest2",
                    isToday
                      ? "text-lime"
                      : isAnchor
                      ? "text-lime"
                      : inMonth
                      ? "text-paper/80"
                      : "text-paper/25",
                    isWeekend && inMonth && !isToday && !isAnchor && "text-paper/50"
                  )}
                >
                  {String(day).padStart(2, "0")}
                </span>
                {isToday && (
                  <span className="font-mono text-[8px] uppercase tracking-widest2 text-lime">
                    TODAY
                  </span>
                )}
                {!isToday && isAnchor && (
                  <span className="font-mono text-[8px] uppercase tracking-widest2 text-lime">
                    ● ANCHOR
                  </span>
                )}
                {!isToday && !isAnchor && dayEvents.length > 0 && (
                  <span className="font-mono text-[8px] uppercase tracking-widest2 text-paper/30">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event chips */}
              <div className="mt-1 flex-1 space-y-0.5">
                {dayEvents.slice(0, MAX_EVENTS_IN_CELL).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-1.5 overflow-hidden"
                    title={e.title}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 border",
                        IMPACT_DOT[e.impact]
                      )}
                    />
                    <span className="truncate font-mono text-[9px] uppercase tracking-widest2 text-paper/70 group-hover:text-paper">
                      {shortName(e.title)}
                    </span>
                  </div>
                ))}
                {overflow > 0 && (
                  <div className="font-mono text-[9px] uppercase tracking-widest2 text-lime/70">
                    +{overflow} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
