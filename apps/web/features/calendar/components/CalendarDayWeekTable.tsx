import { Fragment } from "react";
import { cn, formatWibTime } from "@/lib/cn";
import type { CalendarEvent } from "@/features/calendar/types";
import { TODAY_YMD } from "@/features/calendar/types";
import { addDays, ymdToDate } from "@/features/calendar/lib/date";
import { EventRow, ROW_COLS } from "@/features/calendar/components/EventRow";

type Group = { ymd: string; events: CalendarEvent[] };

type Props = {
  groups: Group[];
  emptyState: React.ReactNode;
  /** Wall clock, for the now line, dimming and the next release countdown. */
  now: number;
  className?: string;
};

/** "Today, Mon 2 Nov" */
function dayLabel(ymd: string): string {
  const d = ymdToDate(ymd).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const rel = ymd === TODAY_YMD ? "Today" : ymd === addDays(TODAY_YMD, 1) ? "Tomorrow" : ymd === addDays(TODAY_YMD, -1) ? "Yesterday" : null;
  return rel ? `${rel}, ${d.replace(",", "")}` : d.replace(",", "");
}

function NowLine({ now }: { now: number }) {
  return (
    <li aria-label="Now" className="relative flex items-center gap-2 py-1.5 pl-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand" suppressHydrationWarning>
        Now {formatWibTime(new Date(now).toISOString())}
      </span>
      <span className="h-px flex-1 bg-brand/50" />
    </li>
  );
}

/** Rows grouped by WIB day under sticky day headers. */
export function CalendarDayWeekTable({ groups, emptyState, now, className }: Props) {
  if (groups.length === 0) return <div className={cn("py-12", className)}>{emptyState}</div>;
  const nowIso = new Date(now).toISOString();
  const nextId = groups.flatMap((g) => g.events).find((e) => e.ts > nowIso)?.id;
  return (
    <div className={className}>
      {groups.map(({ ymd, events }) => {
        const today = ymd === TODAY_YMD;
        const cut = today ? events.findIndex((e) => e.ts > nowIso) : -2;
        const nowAt = cut === -1 ? events.length : cut;
        return (
          <section key={ymd} aria-label={dayLabel(ymd)}>
            <div
              className={cn(
                "sticky top-[68px] sm:top-[76px] z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 border-b border-white/[0.07] bg-panel px-2 pb-2 pt-4",
                ROW_COLS,
              )}
            >
              <h3 className={cn("text-[13px] font-semibold sm:col-span-4", today ? "text-brand" : "text-white")}>
                {dayLabel(ymd)}
                <span className="ml-2 font-normal text-white/35">{events.length}</span>
              </h3>
              {["Actual", "Forecast", "Previous"].map((h) => (
                <span key={h} className="hidden text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35 sm:block">
                  {h}
                </span>
              ))}
            </div>
            <ul className="divide-y divide-white/[0.05]">
              {events.map((e, i) => (
                <Fragment key={e.id}>
                  {i === nowAt && <NowLine now={now} />}
                  <EventRow event={e} past={e.ts <= nowIso} next={e.id === nextId} />
                </Fragment>
              ))}
              {nowAt === events.length && <NowLine now={now} />}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
