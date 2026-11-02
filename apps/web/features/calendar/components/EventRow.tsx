import Link from "next/link";
import { cn, formatWibTime } from "@/lib/cn";
import type { CalendarEvent } from "@/features/calendar/types";
import { labelOf, surpriseTone } from "@/features/calendar/lib/econ";
import { Countdown, ImpactBars } from "@/features/calendar/components/EventBits";

/** Shared column template for the day header and the rows (desktop). */
export const ROW_COLS = "sm:grid-cols-[52px_72px_28px_minmax(0,1fr)_76px_76px_76px]";

const TONE = { up: "text-up", down: "text-down" } as const;

function Fig({ v, tone, className }: { v?: string; tone?: string; className?: string }) {
  return <span className={cn("text-right font-num text-[17px] font-semibold leading-5", v ? tone : "text-white/15", className)}>{v ?? "-"}</span>;
}

/**
 * One release. ForexFactory column order (time, currency, impact, event, actual,
 * forecast, previous); on a phone it folds into time, name and the one figure that matters.
 */
export function EventRow({ event, past, next }: { event: CalendarEvent; past: boolean; next: boolean }) {
  const { cur, flag, name } = labelOf(event);
  const fc = event.forecast ?? event.consensus;
  const tone = surpriseTone(name, event.actual, fc);
  const actualCls = tone ? TONE[tone] : "text-white";
  return (
    <li>
      <Link
        href={`/app/calendar/${event.id}`}
        className={cn(
          "group grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-3 px-2 py-3 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-brand sm:gap-x-2",
          ROW_COLS,
          past && !event.actual && "opacity-50",
          past && event.actual && "[&_.dim]:opacity-60",
          next && "bg-brand/[0.04]",
        )}
      >
        {/* time; on a phone the impact meter sits under it */}
        <span className="dim flex flex-col gap-1.5 text-[13px] tabular-nums text-white/90 sm:block">
          {formatWibTime(event.ts)}
          <ImpactBars impact={event.impact} className="sm:hidden" />
        </span>
        <span className="dim hidden items-center gap-1.5 text-[13px] font-medium text-white/80 sm:flex">
          <span aria-hidden className="text-[15px] leading-none">{flag}</span>
          {cur}
        </span>
        <span className="hidden sm:block">
          <ImpactBars impact={event.impact} />
        </span>
        <span className="dim min-w-0">
          <span className={cn("line-clamp-2 text-[15px] leading-[20px] group-hover:text-brand", event.impact === "high" ? "font-medium text-white" : "text-white/85")}>
            <span aria-hidden className="mr-1.5 sm:hidden">{flag}</span>
            {name}
          </span>
          {/* phone meta line */}
          <span className="mt-0.5 block truncate text-[12px] text-white/40 sm:hidden">
            {cur}
            {event.actual && fc && <> · F {fc}</>}
            {event.previous && <> · P {event.previous}</>}
          </span>
        </span>

        {/* actual column: the print, a countdown on the next release, or nothing yet */}
        <span className="text-right">
          {event.actual ? (
            <Fig v={event.actual} tone={actualCls} />
          ) : next ? (
            <Countdown ts={event.ts} className="text-[13px] font-medium text-brand" />
          ) : (
            <>
              <Fig v={undefined} className="hidden sm:inline" />
              {fc && <span className="font-num text-[17px] font-semibold text-white/60 sm:hidden">{fc}</span>}
            </>
          )}
          {!event.actual && fc && !next && <span className="block text-[11px] text-white/30 sm:hidden">forecast</span>}
        </span>
        <Fig v={fc} tone="text-white/60" className="dim hidden sm:block" />
        <Fig v={event.previous} tone="text-white/45" className="dim hidden sm:block" />
      </Link>
    </li>
  );
}
