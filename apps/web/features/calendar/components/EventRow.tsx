import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CalendarEvent } from "@/features/calendar/types";
import { formatCalendarTime } from "@/features/calendar/lib/format";
import { IMPACT_LABEL, IMPACT_STYLE } from "@/features/calendar/lib/style";
import { ScoreCell } from "@/features/calendar/components/ScoreCell";

export function EventRow({
  event,
  anchorYmd,
  showTimeOffset = true,
}: {
  event: CalendarEvent;
  anchorYmd: string;
  showTimeOffset?: boolean;
}) {
  return (
    <div className="group grid grid-cols-[minmax(200px,2fr)_72px_64px_72px_72px_72px_repeat(7,minmax(36px,1fr))] items-center gap-3 border-b border-gray-3 bg-black px-3 py-3 transition-colors hover:bg-gray-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <Link
            href={`/app/calendar/${event.id}`}
            className="font-display text-base leading-tight text-white transition-colors group-hover:text-brand hover:text-brand hover:underline focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            {event.title}
          </Link>
          {event.relatedNewsId && (
            <Link
              href={`/app/news/${event.relatedNewsId}`}
              className="border border-brand/40 bg-brand/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              ↗ NEWS
            </Link>
          )}
        </div>
        {event.notes && (
          <div className="mt-1 line-clamp-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            ● {event.notes}
          </div>
        )}
      </div>

      <div className="text-center font-mono text-xs text-white/70">
        {formatCalendarTime(event.ts, anchorYmd, showTimeOffset)}
      </div>

      <div className="flex justify-center">
        <span
          className={cn(
            "border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2",
            IMPACT_STYLE[event.impact]
          )}
        >
          {IMPACT_LABEL[event.impact]}
        </span>
      </div>

      <div className="text-center font-mono text-[11px] text-white/80">
        {event.actual ?? "—"}
      </div>
      <div className="text-center font-mono text-[11px] text-white/50">
        {event.previous ?? "—"}
      </div>
      <div className="text-center font-mono text-[11px] text-white/50">
        {event.consensus ?? "—"}
      </div>

      {event.scores.map((s, i) => (
        <ScoreCell key={i} value={s} />
      ))}
    </div>
  );
}
