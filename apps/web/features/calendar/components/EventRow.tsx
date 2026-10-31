import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CalendarEvent } from "@/features/calendar/types";
import { formatCalendarTime } from "@/features/calendar/lib/format";
import { IMPACT_DOT, IMPACT_LABEL } from "@/features/calendar/lib/style";

/** "USD — CPI YoY" from the worker becomes ["USD", "CPI YoY"]. */
export function splitTitle(e: CalendarEvent): { cur: string; name: string } {
  const [cur, ...rest] = e.title.split(" — ");
  return rest.length
    ? { cur, name: rest.join(" — ") }
    : { cur: e.region === "GLOBAL" ? "Other" : e.region, name: e.title };
}

function Figure({
  value,
  label,
  strong,
}: {
  value?: string;
  label: string;
  strong?: boolean;
}) {
  return (
    <div className="w-[68px] text-right">
      <div
        className={cn(
          "font-num text-[19px] font-semibold leading-5",
          value ? (strong ? "text-white" : "text-white/60") : "text-white/15",
        )}
      >
        {value ?? "·"}
      </div>
      <div className="text-[11px] text-white/30">{label}</div>
    </div>
  );
}

/** Kalshi row: time, impact dot, name with region chip, condensed figures on the right. */
export function EventRow({
  event,
  anchorYmd,
  showTimeOffset = true,
}: {
  event: CalendarEvent;
  anchorYmd: string;
  showTimeOffset?: boolean;
}) {
  const { cur, name } = splitTitle(event);
  const fc = event.forecast ?? event.consensus;
  const mobileFigure = event.actual ?? fc;
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="w-11 shrink-0 text-[13px] tabular-nums text-white/90">
        {formatCalendarTime(event.ts, anchorYmd, showTimeOffset).replace(
          " WIB",
          "",
        )}
      </div>
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          IMPACT_DOT[event.impact],
        )}
        title={`${IMPACT_LABEL[event.impact]} impact`}
        aria-label={`${IMPACT_LABEL[event.impact]} impact`}
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/app/calendar/${event.id}`}
          className="line-clamp-2 text-[15px] leading-[21px] text-white transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          {name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-white/40">
          <span className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] text-white/60">
            {cur}
          </span>
          {event.impact === "high" && (
            <span className="font-semibold text-brand">High impact</span>
          )}
          {event.relatedNewsId && (
            <Link
              href={`/app/news/${event.relatedNewsId}`}
              className="text-white/55 hover:text-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              News ↗
            </Link>
          )}
          {event.notes && (
            <span className="line-clamp-1 min-w-0 basis-full sm:basis-auto sm:flex-1">
              {event.notes}
            </span>
          )}
          {/* Phone: forecast and previous fold into the meta line */}
          <span className="sm:hidden">
            {event.actual && fc && <>f {fc} </>}
            {event.previous && <>p {event.previous}</>}
          </span>
        </div>
      </div>
      {(event.actual || fc || event.previous) && (
        <div className="hidden shrink-0 gap-2 sm:flex">
          <Figure value={event.actual} label="actual" strong />
          <Figure value={fc} label="forecast" />
          <Figure value={event.previous} label="previous" />
        </div>
      )}
      {mobileFigure && (
        <div className="shrink-0 text-right sm:hidden">
          <div className="font-num text-[19px] font-semibold leading-5 text-white">
            {mobileFigure}
          </div>
          <div className="text-[11px] text-white/30">
            {event.actual ? "actual" : "forecast"}
          </div>
        </div>
      )}
    </li>
  );
}
