"use client";

import { cn } from "@/lib/cn";
import { Panel, PanelLink } from "@/components/ui/Panel";
import { AnimatedFigure } from "@/components/ui/AnimatedNumber";
import type { CalendarEvent } from "@/features/calendar/types";
import { useNow } from "@/features/dashboard/hooks/useLive";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "short", timeZone: "Asia/Jakarta" });

const HOUR = 3600_000;

/** "in 2h 14m"; inside the last hour it counts seconds. */
function until(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `in ${d}d ${h}h`;
  if (h) return `in ${h}h ${m}m`;
  return `in ${m}m ${String(s % 60).padStart(2, "0")}s`;
}

/** Next scheduled macro events, Kalshi row style: label left, big number right. The next one counts down. */
export function CalendarPanel({ events, sub = "Next medium and high impact events, WIB" }: { events: CalendarEvent[]; sub?: string }) {
  const now = useNow(1000);
  const nextId = events.find((e) => new Date(e.ts).getTime() > now)?.id;
  return (
    <Panel title="Calendar" sub={sub} action={<PanelLink href="/app/calendar">All</PanelLink>} className="surface-hover">
      {events.length === 0 ? (
        <p className="py-6 text-[14px] text-white/40">Nothing scheduled in the next few days.</p>
      ) : (
        <ul className="-my-1 divide-y divide-white/[0.07]">
          {events.map((e, i) => {
            const [cur, ...rest] = e.title.split(" — ");
            const name = rest.length ? rest.join(" — ") : e.title;
            const figure = e.actual ?? e.forecast ?? e.consensus;
            const left = new Date(e.ts).getTime() - now;
            const next = e.id === nextId;
            return (
              <li
                key={e.id}
                className={cn("enter-row flex items-center gap-3 py-2.5", next && left < HOUR && "soon")}
                style={{ "--i": i } as React.CSSProperties}
              >
                <div className="w-12 shrink-0 text-[12px] leading-4">
                  <div className="text-white/90">{time(e.ts)}</div>
                  <div className="text-white/30">{day(e.ts)}</div>
                </div>
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", e.impact === "high" ? "bg-brand text-brand" : "bg-white/35 text-white/35", next && "live-dot")}
                  title={`${e.impact} impact`}
                  aria-label={`${e.impact} impact`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] capitalize text-white">{name}</div>
                  <div className="text-[12px] text-white/40">
                    {next && (
                      <span className="font-medium tabular-nums text-brand" suppressHydrationWarning>
                        {until(left)}
                        <span className="px-1 text-white/25">·</span>
                      </span>
                    )}
                    {rest.length ? cur : e.region}
                    {e.previous && <span> · prev {e.previous}</span>}
                  </div>
                </div>
                {figure && (
                  <div className="shrink-0 text-right">
                    <div className="font-num text-[20px] font-semibold leading-5 text-white"><AnimatedFigure text={figure} fromRatio={0.9} /></div>
                    <div className="text-[11px] text-white/40">{e.actual ? "actual" : "forecast"}</div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
