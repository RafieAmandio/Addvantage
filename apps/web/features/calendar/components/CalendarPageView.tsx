"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";
import type { CalendarEvent } from "@/features/calendar/types";
import {
  TODAY_YMD,
  type ImpactFilter,
  type RegionFilter,
  type ViewMode,
} from "@/features/calendar/types";
import { wibYmd } from "@/features/calendar/lib/date";
import {
  parseAnchor,
  parseImpact,
  parseRegion,
  parseViewMode,
  rangeForView,
  rangeLabel,
} from "@/features/calendar/lib/view";
import { groupByDay } from "@/features/calendar/lib/group";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";
import { formatDayHeader } from "@/features/calendar/lib/format";
import { IMPACT_LABEL, IMPACT_TEXT } from "@/features/calendar/lib/style";
import { MonthGrid } from "@/features/calendar/components/MonthGrid";
import { currencyOf, flagOf, labelOf } from "@/features/calendar/lib/econ";
import { Countdown, ImpactBars, useNow } from "@/features/calendar/components/EventBits";
import { CalendarToolbar } from "@/features/calendar/components/CalendarToolbar";
import { CalendarFilterBar } from "@/features/calendar/components/CalendarFilterBar";
import { CalendarEmptyState } from "@/features/calendar/components/CalendarEmptyState";
import { CalendarDayWeekTable } from "@/features/calendar/components/CalendarDayWeekTable";
import { useCalendarKeyboard } from "@/features/calendar/hooks/useCalendarKeyboard";

interface CalendarPageViewProps {
  events?: CalendarEvent[];
}

export function CalendarPageView({ events = [] }: CalendarPageViewProps) {
  const searchParams = useSearchParams();

  const [view, setView] = useState<ViewMode>(() =>
    parseViewMode(searchParams.get("view"))
  );
  const [anchor, setAnchor] = useState<string>(() =>
    parseAnchor(searchParams.get("d"))
  );
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>(() =>
    parseImpact(searchParams.get("impact"))
  );
  const [regionFilter, setRegionFilter] = useState<RegionFilter>(() =>
    parseRegion(searchParams.get("region"))
  );

  useUrlSyncedState({
    view: view !== "week" ? view : null,
    d: anchor !== TODAY_YMD ? anchor : null,
    impact: impactFilter !== "all" ? impactFilter : null,
    region: regionFilter !== "all" ? regionFilter : null,
  });

  const setAnchorAbsolute = useCallback((ymd: string) => setAnchor(ymd), []);
  useCalendarKeyboard(view, setAnchor, setAnchorAbsolute);

  const { start, end } = useMemo(() => rangeForView(view, anchor), [view, anchor]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const ymd = wibYmd(e.ts);
      if (ymd < start || ymd > end) return false;
      if (impactFilter !== "all" && e.impact !== impactFilter) return false;
      if (regionFilter !== "all" && e.region !== regionFilter) return false;
      return true;
    });
  }, [events, start, end, impactFilter, regionFilter]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  const filtersActive = impactFilter !== "all" || regionFilter !== "all";

  const resetFilters = useCallback(() => {
    setImpactFilter("all");
    setRegionFilter("all");
  }, []);

  const nearestEventDate = useMemo(() => {
    const matching = events.filter((e) => {
      if (impactFilter !== "all" && e.impact !== impactFilter) return false;
      if (regionFilter !== "all" && e.region !== regionFilter) return false;
      return true;
    });
    if (matching.length === 0) return { forward: null, backward: null };

    const forwardEvents = matching
      .map((e) => wibYmd(e.ts))
      .filter((ymd) => ymd > end)
      .sort();
    const backwardEvents = matching
      .map((e) => wibYmd(e.ts))
      .filter((ymd) => ymd < start)
      .sort()
      .reverse();

    return {
      forward: forwardEvents[0] ?? null,
      backward: backwardEvents[0] ?? null,
    };
  }, [events, start, end, impactFilter, regionFilter]);

  const jumpToNearest = useCallback(
    (dir: 1 | -1) => {
      const target =
        dir === 1 ? nearestEventDate.forward : nearestEventDate.backward;
      if (target) setAnchor(target);
    },
    [nearestEventDate]
  );

  const goToday = useCallback(() => setAnchor(TODAY_YMD), []);

  // Week of the anchor, ignoring filters, so the counts always describe the whole week.
  const glance = useMemo(() => {
    const { start: ws, end: we } = rangeForView("week", anchor);
    const week = events.filter((e) => {
      const ymd = wibYmd(e.ts);
      return ymd >= ws && ymd <= we;
    });
    const impact = { high: 0, medium: 0, low: 0 };
    const regions = new Map<string, { total: number; high: number }>();
    const days = new Map<string, number>();
    for (const e of week) {
      impact[e.impact]++;
      const r = regions.get(e.region) ?? { total: 0, high: 0 };
      r.total++;
      if (e.impact === "high") r.high++;
      regions.set(e.region, r);
      const d = wibYmd(e.ts);
      days.set(d, (days.get(d) ?? 0) + 1);
    }
    const busiest = [...days].sort((a, b) => b[1] - a[1])[0] ?? null;
    return {
      label: rangeLabel("week", anchor),
      total: week.length,
      impact,
      regions: [...regions].sort((a, b) => b[1].total - a[1].total),
      busiest,
    };
  }, [events, anchor]);

  // Minute clock for the now line and dimming; countdowns tick on their own.
  const now = useNow(30_000);
  const nextHigh = useMemo(() => {
    const iso = new Date(now).toISOString();
    return events
      .filter((e) => e.impact === "high" && e.ts > iso)
      .sort((a, b) => a.ts.localeCompare(b.ts))
      .slice(0, 6);
  }, [events, now]);
  const up = nextHigh[0];
  const upLabel = up && labelOf(up);

  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        {up && upLabel && (
          <Link
            href={`/app/calendar/${up.id}`}
            className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 rounded-2xl bg-panel px-5 py-4 transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">
                <ImpactBars impact="high" />
                Next high impact
              </span>
              <span className="mt-1.5 flex min-w-0 items-center gap-2">
                <span aria-hidden className="text-[18px] leading-none">{upLabel.flag}</span>
                <span className="line-clamp-2 text-[16px] font-medium leading-[21px] text-white group-hover:text-brand">{upLabel.name}</span>
              </span>
              <span className="mt-0.5 block text-[13px] text-white/40">
                {upLabel.cur} · {formatDayHeader(wibYmd(up.ts)).replace(/^(\w{3})\w*/, "$1")},{" "}
                {new Date(up.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB
                {(up.forecast ?? up.consensus) && <span className="whitespace-nowrap"> · F {up.forecast ?? up.consensus}</span>}
              </span>
            </span>
            <Countdown ts={up.ts} className="whitespace-nowrap font-num text-[22px] font-semibold leading-7 text-brand sm:text-[34px] sm:leading-9" />
          </Link>
        )}
        <Panel
          title="Economic calendar"
          sub={`${filtered.length} ${filtered.length === 1 ? "release" : "releases"} · times in WIB (UTC+7)`}
        >
          <CalendarToolbar
            view={view}
            anchor={anchor}
            label={rangeLabel(view, anchor)}
            onViewChange={setView}
            onAnchorChange={setAnchor}
          />
          <CalendarFilterBar
            className="mt-3"
            impactFilter={impactFilter}
            regionFilter={regionFilter}
            filtersActive={filtersActive}
            onImpactChange={setImpactFilter}
            onRegionChange={setRegionFilter}
            onReset={resetFilters}
          />

          <div className="mt-2 -mx-2">
            {view === "month" && (
              <div className="relative">
                <MonthGrid
                  anchor={anchor}
                  events={filtered}
                  onPickDay={(ymd) => {
                    setAnchor(ymd);
                    setView("day");
                  }}
                />
                {filtered.length === 0 && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                    <div className="pointer-events-auto rounded-2xl bg-raised p-6">
                      <CalendarEmptyState
                        variant="month"
                        title={`No events in ${rangeLabel("month", anchor)}.`}
                        filtersActive={filtersActive}
                        nearestBackward={nearestEventDate.backward}
                        nearestForward={nearestEventDate.forward}
                        anchor={anchor}
                        onJumpToNearest={jumpToNearest}
                        onToday={goToday}
                        onResetFilters={resetFilters}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {view !== "month" && (
              <CalendarDayWeekTable
                now={now}
                groups={groups}
                emptyState={
                  <CalendarEmptyState
                    variant="table"
                    title={`No events in this ${view}.`}
                    filtersActive={filtersActive}
                    nearestBackward={nearestEventDate.backward}
                    nearestForward={nearestEventDate.forward}
                    anchor={anchor}
                    onJumpToNearest={jumpToNearest}
                    onToday={goToday}
                    onResetFilters={resetFilters}
                  />
                }
              />
            )}
          </div>
        </Panel>
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="This week at a glance" sub={`${glance.label} · ${glance.total} events`}>
          <div className="grid grid-cols-3 gap-2">
            {(["high", "medium", "low"] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setImpactFilter(impactFilter === lvl ? "all" : lvl)}
                aria-pressed={impactFilter === lvl}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
                  impactFilter === lvl ? "bg-raised" : "bg-white/[0.03]",
                )}
              >
                <div className={cn("font-num text-[32px] font-semibold leading-8", lvl === "high" ? "text-brand" : "text-white")}>
                  {glance.impact[lvl]}
                </div>
                <div className={cn("mt-1 flex items-center gap-1.5 text-[12px]", IMPACT_TEXT[lvl])}>
                  <ImpactBars impact={lvl} />
                  {IMPACT_LABEL[lvl]}
                </div>
              </button>
            ))}
          </div>

          {glance.regions.length > 0 && (
            <>
              <div className="mt-5 flex justify-between text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
                <span>Currency</span>
                <span>Events · high</span>
              </div>
              <ul className="mt-1 divide-y divide-white/[0.07]">
                {glance.regions.map(([region, c]) => (
                  <li key={region}>
                    <button
                      type="button"
                      onClick={() => setRegionFilter(regionFilter === region ? "all" : (region as RegionFilter))}
                      aria-pressed={regionFilter === region}
                      className="flex w-full items-center gap-3 py-2 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                    >
                      <span className={cn("flex w-16 items-center gap-1.5 text-[14px] font-semibold", regionFilter === region ? "text-brand" : "text-white")}>
                        <span aria-hidden className="text-[14px] leading-none">{flagOf(currencyOf(region, ""))}</span>
                        {currencyOf(region, "")}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <span
                          className="block h-full rounded-full bg-white/40"
                          style={{ width: `${(c.total / glance.regions[0][1].total) * 100}%` }}
                        />
                      </span>
                      <span className="w-14 text-right font-num text-[17px] font-semibold text-white">
                        {c.total}
                        <span className={cn("ml-1.5", c.high ? "text-brand" : "text-white/20")}>{c.high}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {glance.busiest && (
            <p className="mt-4 text-[13px] text-white/55">
              Busiest day{" "}
              <button
                type="button"
                onClick={() => {
                  setAnchor(glance.busiest![0]);
                  setView("day");
                }}
                className="font-medium text-white hover:text-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                {formatDayHeader(glance.busiest[0])}
              </button>
              , {glance.busiest[1]} events.
            </p>
          )}
        </Panel>

        <Panel title="Coming up" sub="High impact releases after the next one">
          {nextHigh.length <= 1 ? (
            <p className="py-4 text-[14px] text-white/40">No high impact release scheduled.</p>
          ) : (
            <ul className="-my-1 divide-y divide-white/[0.07]">
              {nextHigh.slice(1).map((e) => {
                const { cur, flag, name } = labelOf(e);
                const ymd = wibYmd(e.ts);
                return (
                  <li key={e.id}>
                    <Link
                      href={`/app/calendar/${e.id}`}
                      className="group flex items-center gap-3 py-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                    >
                      <span aria-hidden className="text-[16px] leading-none">{flag}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-white group-hover:text-brand">{name}</span>
                        <span className="text-[12px] text-white/40">
                          {cur} · {formatDayHeader(ymd).replace(/^(\w{3})\w*/, "$1")}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[13px] tabular-nums text-white/90">
                          {new Date(e.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
                        </span>
                        <Countdown ts={e.ts} className="text-[12px] text-white/40" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </aside>
    </div>
  );
}
