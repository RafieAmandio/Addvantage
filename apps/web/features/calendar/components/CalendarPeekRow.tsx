import Link from "next/link";
import type { CalendarEvent } from "@/lib/mock/types";
import { CURRENCIES } from "@/features/calendar/mock";
import { formatTime } from "@/lib/cn";

/**
 * Compact calendar row used in sidebars / dashboard peeks.
 * Shows time, region, impact, and the single highest-scored currency.
 */
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
      className="group flex items-start gap-3 bg-ink p-3 transition-colors hover:bg-gray-2"
    >
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
        {formatTime(event.ts)}Z
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
          <span>{event.region}</span>
          <span className="text-lime/40">·</span>
          <span>{event.impact}</span>
          <span className="text-lime/40">·</span>
          <span className="text-lime">
            {topCcy} {topScore}/9
          </span>
        </div>
        <div className="truncate text-sm text-paper transition-colors group-hover:text-brand">
          {event.title}
        </div>
      </div>
    </Link>
  );
}
