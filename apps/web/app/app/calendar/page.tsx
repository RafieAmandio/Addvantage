"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { calendar, CURRENCIES } from "@/features/calendar/mock";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { cn } from "@/lib/cn";
import {
  DEMO_TODAY_YMD,
  REGIONS,
  type ImpactFilter,
  type RegionFilter,
  type ViewMode,
} from "@/features/calendar/types";
import { addDays, wibYmd } from "@/features/calendar/lib/date";
import { formatDayHeader } from "@/features/calendar/lib/format";
import {
  parseAnchor,
  parseImpact,
  parseRegion,
  parseViewMode,
  rangeForView,
  rangeLabel,
  stepAnchor,
} from "@/features/calendar/lib/view";
import { deriveSummary, groupByDay } from "@/features/calendar/lib/group";
import { CalendarFallback } from "@/features/calendar/components/CalendarFallback";
import { FilterChips } from "@/features/calendar/components/FilterChips";
import { EventRow } from "@/features/calendar/components/EventRow";
import { MonthGrid } from "@/features/calendar/components/MonthGrid";

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarFallback />}>
      <CalendarView />
    </Suspense>
  );
}

function CalendarView() {
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

  // Keyboard shortcuts: [ / ] view-step, j / k day-step, t today.
  // Dispatched from the global Shortcuts component via CustomEvents.
  useEffect(() => {
    const onStep = (e: Event) => {
      const dir = (e as CustomEvent<number>).detail === -1 ? -1 : 1;
      setAnchor((a) => stepAnchor(view, a, dir as 1 | -1));
    };
    const onDayStep = (e: Event) => {
      const dir = (e as CustomEvent<number>).detail === -1 ? -1 : 1;
      setAnchor((a) => addDays(a, dir));
    };
    const onToday = () => setAnchor(DEMO_TODAY_YMD);
    window.addEventListener("ants:calendar-step", onStep);
    window.addEventListener("ants:calendar-day-step", onDayStep);
    window.addEventListener("ants:calendar-today", onToday);
    return () => {
      window.removeEventListener("ants:calendar-step", onStep);
      window.removeEventListener("ants:calendar-day-step", onDayStep);
      window.removeEventListener("ants:calendar-today", onToday);
    };
  }, [view]);

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

  const resetFilters = () => {
    setImpactFilter("all");
    setRegionFilter("all");
  };

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

    const rangeEnd = end;
    const rangeStart = start;

    const forwardEvents = matching
      .map((e) => wibYmd(e.ts))
      .filter((ymd) => ymd > rangeEnd)
      .sort();
    const backwardEvents = matching
      .map((e) => wibYmd(e.ts))
      .filter((ymd) => ymd < rangeStart)
      .sort()
      .reverse();

    return {
      forward: forwardEvents[0] ?? null,
      backward: backwardEvents[0] ?? null,
    };
  }, [start, end, impactFilter, regionFilter]);

  const jumpToNearest = (dir: 1 | -1) => {
    const target =
      dir === 1 ? nearestEventDate.forward : nearestEventDate.backward;
    if (target) setAnchor(target);
  };

  return (
    <div>
      {/* ─── HERO ─── */}
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <DataLabel>Transmission TX-02 · Free pillar</DataLabel>
          <h1 className="mt-2 font-display text-5xl text-paper">
            Economic <span className="italic text-lime">Calendar</span>
          </h1>
          <p className="mt-2 max-w-2xl font-display text-lg text-paper/60">
            Every high-impact release that moves global and IDX markets.
            Per-currency impact scoring, curated day summaries, and the
            desk's note on what actually matters — not the wire blurb.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* ─── CONTROLS ROW ─── */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          {/* View selector */}
          <div className="flex gap-px bg-ink-3" role="tablist" aria-label="Calendar view">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                role="tab"
                aria-selected={view === v}
                className={cn(
                  "px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 transition-colors",
                  view === v
                    ? "bg-lime text-ink"
                    : "bg-ink-2 text-paper/60 hover:bg-ink-2 hover:text-paper"
                )}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Date stepper */}
          <div className="flex items-center justify-center gap-2 lg:gap-3">
            <button
              onClick={() => setAnchor(stepAnchor(view, anchor, -1))}
              aria-label={`Previous ${view}`}
              className="border border-ink-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
            >
              ←
            </button>
            <div className="min-w-[180px] border border-lime/40 bg-ink-2/40 px-4 py-2 text-center">
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                {view === "day"
                  ? "Day"
                  : view === "week"
                  ? "Week"
                  : "Month"}
              </div>
              <div className="font-display text-base text-lime">
                {rangeLabel(view, anchor)}
              </div>
            </div>
            <button
              onClick={() => setAnchor(stepAnchor(view, anchor, 1))}
              aria-label={`Next ${view}`}
              className="border border-ink-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
            >
              →
            </button>
            <button
              onClick={() => setAnchor(DEMO_TODAY_YMD)}
              disabled={anchor === DEMO_TODAY_YMD}
              className={cn(
                "ml-2 border px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 transition-colors",
                anchor === DEMO_TODAY_YMD
                  ? "cursor-default border-ink-3 text-paper/30"
                  : "border-lime/60 text-lime hover:bg-lime hover:text-ink"
              )}
            >
              Today
            </button>
          </div>

          {/* Counts */}
          <div className="flex items-center justify-end gap-3 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
            <span className="text-lime">{filtered.length}</span>
            <span>events in view</span>
          </div>
        </div>

        {/* ─── FILTER CHIPS ─── */}
        <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              Impact
            </span>
            <FilterChips
              options={[
                { value: "all", label: "All" },
                { value: "high", label: "High" },
                { value: "medium", label: "Mod" },
                { value: "low", label: "Low" },
              ]}
              value={impactFilter}
              onChange={(v) => setImpactFilter(v as ImpactFilter)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              Region
            </span>
            <FilterChips
              options={[
                { value: "all", label: "All" },
                ...REGIONS.map((r) => ({ value: r, label: r })),
              ]}
              value={regionFilter}
              onChange={(v) => setRegionFilter(v as RegionFilter)}
            />
          </div>

          <div className="flex justify-end">
            {filtersActive && (
              <button
                onClick={resetFilters}
                className="border border-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-blood hover:text-blood"
              >
                ✕ Reset filters
              </button>
            )}
          </div>
        </div>

        {/* ─── MONTH GRID ─── */}
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
                <div className="pointer-events-auto max-w-md border border-lime bg-ink-2/95 p-6 text-center shadow-[0_0_60px_rgba(245,158,11,0.18)] backdrop-blur">
                  <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood">
                    ● NULL TRANSMISSION
                  </div>
                  <div className="mt-3 font-display text-2xl text-paper">
                    No events in {rangeLabel("month", anchor)}.
                  </div>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                    {filtersActive
                      ? "Filters are excluding everything in this month."
                      : "The desk hasn't published anything in this window."}
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {nearestEventDate.backward && (
                      <button
                        onClick={() => jumpToNearest(-1)}
                        className="border border-lime/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
                      >
                        ← Prev event
                      </button>
                    )}
                    <button
                      onClick={() => setAnchor(DEMO_TODAY_YMD)}
                      disabled={anchor === DEMO_TODAY_YMD}
                      className={cn(
                        "border px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2",
                        anchor === DEMO_TODAY_YMD
                          ? "cursor-default border-ink-3 text-paper/30"
                          : "border-lime/60 text-lime hover:bg-lime hover:text-ink"
                      )}
                    >
                      Today
                    </button>
                    {nearestEventDate.forward && (
                      <button
                        onClick={() => jumpToNearest(1)}
                        className="border border-lime/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
                      >
                        Next event →
                      </button>
                    )}
                    {filtersActive && (
                      <button
                        onClick={resetFilters}
                        className="border border-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
                      >
                        ✕ Reset filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── DAY / WEEK TABLE ─── */}
        {view !== "month" && (
        <div className="overflow-x-auto border border-ink-3">
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
              <div className="border-y border-ink-3 bg-ink-2/40 p-12 text-center">
                <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood">
                  ● NULL TRANSMISSION
                </div>
                <div className="mt-3 font-display text-2xl text-paper">
                  No events in this {view}.
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                  {filtersActive
                    ? "Filters are excluding everything in this range."
                    : "Try a different range — the desk doesn't fabricate releases to fill a screen."}
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {nearestEventDate.backward && (
                    <button
                      onClick={() => jumpToNearest(-1)}
                      className="border border-lime/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
                    >
                      ← Prev event · {formatDayHeader(nearestEventDate.backward)}
                    </button>
                  )}
                  <button
                    onClick={() => setAnchor(DEMO_TODAY_YMD)}
                    disabled={anchor === DEMO_TODAY_YMD}
                    className={cn(
                      "border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2",
                      anchor === DEMO_TODAY_YMD
                        ? "cursor-default border-ink-3 text-paper/30"
                        : "border-lime/60 text-lime hover:bg-lime hover:text-ink"
                    )}
                  >
                    Today
                  </button>
                  {nearestEventDate.forward && (
                    <button
                      onClick={() => jumpToNearest(1)}
                      className="border border-lime/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
                    >
                      Next event · {formatDayHeader(nearestEventDate.forward)} →
                    </button>
                  )}
                  {filtersActive && (
                    <button
                      onClick={resetFilters}
                      className="border border-ink-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
                    >
                      ✕ Reset filters
                    </button>
                  )}
                </div>
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
        )}

        {/* ─── LEGEND ─── */}
        <div className="mt-8 border border-ink-3 bg-ink-2/30 p-4">
          <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
            ● Reading the table
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 text-sm text-paper/70 sm:grid-cols-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                Impact pill
              </div>
              <div className="mt-1 text-xs text-paper/60">
                Overall market impact — High / Mod / Low. Applies to rates,
                equities, and FX in general.
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                Currency scores
              </div>
              <div className="mt-1 text-xs text-paper/60">
                Per-currency reaction scoring, 0 – 9. Higher = more expected
                movement in that currency vs. all others.
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                Time format
              </div>
              <div className="mt-1 text-xs text-paper/60">
                HHMM in WIB (UTC+7). The "+N" suffix is the day offset from
                that day's section header.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

