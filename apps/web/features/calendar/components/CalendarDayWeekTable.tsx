import { cn } from "@/lib/cn";
import { CURRENCIES } from "@/features/calendar/mock";
import type { CalendarEvent } from "@/lib/mock/types";
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

export function CalendarDayWeekTable({
  view,
  groups,
  emptyState,
  className,
}: Props) {
  return (
    <div className={cn("overflow-x-auto border border-ink-3", className)}>
      <div className="min-w-[780px]">
        <div className="sticky top-0 z-20 grid grid-cols-[minmax(220px,2fr)_72px_64px_repeat(7,minmax(36px,1fr))] items-center gap-3 border-b-2 border-lime/40 bg-ink-2/95 px-3 py-2 backdrop-blur">
          <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/50">
            Event
          </div>
          <div className="text-center font-mono text-[9px] uppercase tracking-widest2 text-paper/50">
            Time
          </div>
          <div className="text-center font-mono text-[9px] uppercase tracking-widest2 text-paper/50">
            Impact
          </div>
          {CURRENCIES.map((c) => (
            <div
              key={c}
              className="text-center font-mono text-[10px] uppercase tracking-widest2 text-lime"
            >
              {c}
            </div>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="border-y border-ink-3 bg-ink-2/40 p-12">
            {emptyState}
          </div>
        )}

        {groups.map(({ ymd, events }) => {
          const summary = deriveSummary(events);
          return (
            <section key={ymd}>
              <div className="border-y border-ink-3 bg-ink-2/60 px-3 py-2.5">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                    {formatDayHeader(ymd)}
                  </span>
                  <span className="h-px flex-1 bg-lime/20" />
                  <span className="font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
                    — {summary}
                  </span>
                </div>
              </div>
              {events.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  anchorYmd={ymd}
                  showTimeOffset={view !== "day"}
                />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
