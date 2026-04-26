import Link from "next/link";
import type { CalendarEvent } from "@/features/calendar/types";
import { CURRENCIES } from "@/features/calendar/types";
import { formatTime } from "@/lib/cn";

export function CalendarPeekRow({ event }: { event: CalendarEvent }) {
  const topIdx = event.scores.reduce(
    (best, v, i, arr) => (v > arr[best] ? i : best),
    0
  );
  const topCcy = CURRENCIES[topIdx];
  const topScore = event.scores[topIdx];

  return (
    <Link
      href="/app/calendar"
      className="group flex items-start gap-3 bg-black p-3 transition-colors hover:bg-gray-2"
    >
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
        {formatTime(event.ts)}Z
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          <span>{event.region}</span>
          <span className="text-brand/40">·</span>
          <span>{event.impact}</span>
          <span className="text-brand/40">·</span>
          <span className="text-brand">
            {topCcy} {topScore}/9
          </span>
        </div>
        <div className="truncate text-sm text-white transition-colors group-hover:text-brand">
          {event.title}
        </div>
      </div>
    </Link>
  );
}
