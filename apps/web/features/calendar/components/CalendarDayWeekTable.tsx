import { cn } from "@/lib/cn";
import type { CalendarEvent } from "@/features/calendar/types";
import { TODAY_YMD } from "@/features/calendar/types";
import { formatDayHeader } from "@/features/calendar/lib/format";
import { deriveSummary } from "@/features/calendar/lib/group";
import { EventRow } from "@/features/calendar/components/EventRow";

type Group = { ymd: string; events: CalendarEvent[] };

type Props = {
  view: "day" | "week";
  groups: Group[];
  emptyState: React.ReactNode;
  className?: string;
};

/** Rows grouped by WIB day. */
export function CalendarDayWeekTable({ view, groups, emptyState, className }: Props) {
  if (groups.length === 0) return <div className={cn("py-12", className)}>{emptyState}</div>;
  return (
    <div className={cn("space-y-6", className)}>
      {groups.map(({ ymd, events }) => (
        <section key={ymd}>
          <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.07] pb-2">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
              {formatDayHeader(ymd)}
              {ymd === TODAY_YMD && <span className="ml-2 text-brand">Today</span>}
            </h3>
            <span className="truncate text-[12px] text-white/40">
              {events.length} {events.length === 1 ? "event" : "events"}
              {events.some((e) => e.impact === "high") && <span className="hidden sm:inline"> · {deriveSummary(events)}</span>}
            </span>
          </div>
          <ul className="divide-y divide-white/[0.07]">
            {events.map((e) => (
              <EventRow key={e.id} event={e} anchorYmd={ymd} showTimeOffset={view !== "day"} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
