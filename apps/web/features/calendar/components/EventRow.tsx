import Link from "next/link";
import type { CalendarEvent } from "@/lib/mock/types";
import { news } from "@/features/news/mock";
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
  const related = event.relatedNewsId
    ? news.find((n) => n.id === event.relatedNewsId)
    : null;

  return (
    <div className="group grid grid-cols-[minmax(220px,2fr)_72px_64px_repeat(7,minmax(36px,1fr))] items-center gap-3 border-b border-gray-3 bg-ink px-3 py-3 transition-colors hover:bg-gray-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <Link
            href={`/app/calendar/${event.id}`}
            className="font-display text-base leading-tight text-paper group-hover:text-brand hover:text-brand hover:underline"
          >
            {event.title}
          </Link>
          {related && (
            <Link
              href={`/app/news/${related.id}`}
              title={related.headline}
              className="border border-lime/40 bg-lime/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-lime hover:bg-brand hover:text-ink"
            >
              ↗ {related.id}
            </Link>
          )}
        </div>
        {event.notes && (
          <div className="mt-1 line-clamp-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
            ● {event.notes}
          </div>
        )}
      </div>

      <div className="text-center font-mono text-xs text-paper/70">
        {formatCalendarTime(event.ts, anchorYmd, showTimeOffset)}
      </div>

      <div className="flex justify-center">
        <span
          className={
            "border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 " +
            IMPACT_STYLE[event.impact]
          }
        >
          {IMPACT_LABEL[event.impact]}
        </span>
      </div>

      {event.scores.map((s, i) => (
        <ScoreCell key={i} value={s} />
      ))}
    </div>
  );
}
