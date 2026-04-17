"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { calendar } from "@/features/calendar/mock";
import {
  DEMO_TODAY_YMD,
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
import { MonthGrid } from "@/features/calendar/components/MonthGrid";
import { CalendarHero } from "@/features/calendar/components/CalendarHero";
import { CalendarToolbar } from "@/features/calendar/components/CalendarToolbar";
import { CalendarFilterBar } from "@/features/calendar/components/CalendarFilterBar";
import { CalendarEmptyState } from "@/features/calendar/components/CalendarEmptyState";
import { CalendarDayWeekTable } from "@/features/calendar/components/CalendarDayWeekTable";
import { CalendarLegend } from "@/features/calendar/components/CalendarLegend";
import { useCalendarKeyboard } from "@/features/calendar/hooks/useCalendarKeyboard";

export function CalendarPageView() {
  const router = useRouter();
  const pathname = usePathname();
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

  // Push state to URL (replace, not push — no history pollution when stepping)
  useEffect(() => {
    const sp = new URLSearchParams();
    if (view !== "week") sp.set("view", view);
    if (anchor !== DEMO_TODAY_YMD) sp.set("d", anchor);
    if (impactFilter !== "all") sp.set("impact", impactFilter);
    if (regionFilter !== "all") sp.set("region", regionFilter);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [view, anchor, impactFilter, regionFilter, pathname, router]);

  const setAnchorAbsolute = useCallback((ymd: string) => setAnchor(ymd), []);
  useCalendarKeyboard(view, setAnchor, setAnchorAbsolute);

  const { start, end } = useMemo(() => rangeForView(view, anchor), [view, anchor]);

  const filtered = useMemo(() => {
    return calendar.filter((e) => {
      const ymd = wibYmd(e.ts);
      if (ymd < start || ymd > end) return false;
      if (impactFilter !== "all" && e.impact !== impactFilter) return false;
      if (regionFilter !== "all" && e.region !== regionFilter) return false;
      return true;
    });
  }, [start, end, impactFilter, regionFilter]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  const filtersActive = impactFilter !== "all" || regionFilter !== "all";

  const resetFilters = useCallback(() => {
    setImpactFilter("all");
    setRegionFilter("all");
  }, []);

  /**
   * Find the nearest event matching current filters (ignoring date range).
   * Returns the WIB date of the closest event, or null if no events match.
   * dir = 1 means forward in time, dir = -1 means backward.
   */
  const nearestEventDate = useMemo(() => {
    const matching = calendar.filter((e) => {
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
  }, [start, end, impactFilter, regionFilter]);

  const jumpToNearest = useCallback(
    (dir: 1 | -1) => {
      const target =
        dir === 1 ? nearestEventDate.forward : nearestEventDate.backward;
      if (target) setAnchor(target);
    },
    [nearestEventDate]
  );

  const goToday = useCallback(() => setAnchor(DEMO_TODAY_YMD), []);

  return (
    <div>
      <CalendarHero />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <CalendarToolbar
          view={view}
          anchor={anchor}
          eventCount={filtered.length}
          onViewChange={setView}
          onAnchorChange={setAnchor}
        />

        <CalendarFilterBar
          impactFilter={impactFilter}
          regionFilter={regionFilter}
          filtersActive={filtersActive}
          onImpactChange={setImpactFilter}
          onRegionChange={setRegionFilter}
          onReset={resetFilters}
        />

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
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                <div className="pointer-events-auto border border-lime bg-ink-2/95 p-6 shadow-[0_0_60px_rgba(245,158,11,0.18)] backdrop-blur">
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
            view={view}
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

        <CalendarLegend />
      </div>
    </div>
  );
}
