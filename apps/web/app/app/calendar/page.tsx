"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { calendar, calendarDayMeta, CURRENCIES } from "@/lib/mock/calendar";
import { news } from "@/lib/mock/news";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { cn } from "@/lib/cn";
import type { CalendarEvent, Impact } from "@/lib/mock/types";

// ─────────────────────────────────────────────────────────────
// Anchor / "today" for the demo. The mock data is dated April
// 2026, so we anchor on the day inside that window where the
// dashboard / brief already pivot.
// ─────────────────────────────────────────────────────────────
const DEMO_TODAY_YMD = "2026-04-07";

// ─────────────────────────────────────────────────────────────
// View / filter types
// ─────────────────────────────────────────────────────────────
type ViewMode = "day" | "week" | "month";
type ImpactFilter = "all" | Impact;
type RegionFilter = "all" | CalendarEvent["region"];

const REGIONS: ReadonlyArray<CalendarEvent["region"]> = [
  "US",
  "EU",
  "UK",
  "JP",
  "CN",
  "ID",
  "GLOBAL",
];

// ─────────────────────────────────────────────────────────────
// Date helpers — all anchor / range math is done in WIB (UTC+7)
// because that's what the rest of the table uses.
// ─────────────────────────────────────────────────────────────

function ymdToDate(ymd: string): Date {
  return new Date(ymd + "T00:00:00Z");
}

function dateToYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(ymd: string, n: number): string {
  const d = ymdToDate(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return dateToYmd(d);
}

function addMonths(ymd: string, n: number): string {
  const d = ymdToDate(ymd);
  d.setUTCMonth(d.getUTCMonth() + n);
  return dateToYmd(d);
}

function startOfWeek(ymd: string): string {
  const d = ymdToDate(ymd);
  const dow = d.getUTCDay(); // 0 = Sun, 1 = Mon
  const diff = (dow + 6) % 7; // make Mon = 0
  d.setUTCDate(d.getUTCDate() - diff);
  return dateToYmd(d);
}

function startOfMonth(ymd: string): string {
  return ymd.slice(0, 7) + "-01";
}

function endOfMonth(ymd: string): string {
  const d = ymdToDate(ymd);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return dateToYmd(d);
}

/**
 * For the month grid: return 42 consecutive YYYY-MM-DD strings starting
 * from the Monday of the week containing the 1st of the anchor's month.
 * Always yields 6 full weeks so the grid footprint is stable.
 */
function monthGridDays(anchorYmd: string): string[] {
  const first = startOfMonth(anchorYmd);
  const gridStart = startOfWeek(first);
  const days: string[] = [];
  let cursor = gridStart;
  for (let i = 0; i < 42; i++) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

/** WIB date for an ISO timestamp (the operator's local calendar day). */
function wibYmd(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function rangeForView(view: ViewMode, anchorYmd: string): {
  start: string;
  end: string;
} {
  if (view === "day") return { start: anchorYmd, end: anchorYmd };
  if (view === "week") {
    const start = startOfWeek(anchorYmd);
    return { start, end: addDays(start, 6) };
  }
  return { start: startOfMonth(anchorYmd), end: endOfMonth(anchorYmd) };
}

function stepAnchor(view: ViewMode, anchorYmd: string, dir: 1 | -1): string {
  if (view === "day") return addDays(anchorYmd, dir);
  if (view === "week") return addDays(anchorYmd, dir * 7);
  return addMonths(anchorYmd, dir);
}

function rangeLabel(view: ViewMode, anchorYmd: string): string {
  const { start, end } = rangeForView(view, anchorYmd);
  if (view === "day") {
    return formatDayHeader(start);
  }
  if (view === "week") {
    const a = ymdToDate(start);
    const b = ymdToDate(end);
    const sameMonth = a.getUTCMonth() === b.getUTCMonth();
    const left = a.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    const right = sameMonth
      ? b.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" })
      : b.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
    return `${left} — ${right}`;
  }
  // month
  return ymdToDate(anchorYmd).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ─────────────────────────────────────────────────────────────
// Existing helpers (unchanged)
// ─────────────────────────────────────────────────────────────

function formatCalendarTime(
  iso: string,
  anchorLocalYmd: string,
  showOffset = true
): string {
  const d = new Date(iso);
  const wibMs = d.getTime() + 7 * 60 * 60 * 1000;
  const wib = new Date(wibMs);
  const hh = String(wib.getUTCHours()).padStart(2, "0");
  const mm = String(wib.getUTCMinutes()).padStart(2, "0");
  if (!showOffset) return `${hh}${mm}`;
  const eventYmd = wib.toISOString().slice(0, 10);
  const anchor = ymdToDate(anchorLocalYmd).getTime();
  const eventMid = ymdToDate(eventYmd).getTime();
  const dayOffset = Math.round((eventMid - anchor) / (1000 * 60 * 60 * 24));
  const sign = dayOffset >= 0 ? "+" : "";
  return `${hh}${mm}${sign}${dayOffset}`;
}

function formatDayHeader(ymd: string): string {
  const d = ymdToDate(ymd);
  const weekday = d.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
  const month = d.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const day = d.getUTCDate();
  return `${weekday} ${month} ${day}`;
}

function deriveSummary(events: CalendarEvent[]): string {
  const ymd = wibYmd(events[0].ts);
  const curated = calendarDayMeta.find((m) => m.date === ymd);
  if (curated) return curated.summary;
  const highs = events.filter((e) => e.impact === "high");
  if (highs.length > 0) {
    return highs.slice(0, 3).map((e) => shortName(e.title)).join(" + ");
  }
  return `${events.length} ${events.length === 1 ? "event" : "events"}`;
}

function shortName(title: string): string {
  return title
    .replace(/\s+(MoM|YoY|QoQ|Final\s+Q\d|Q\d|Prel|[A-Z]{3})\b/g, "")
    .replace(/\s+Rate$/i, "")
    .replace(/\s+MoM\/YoY.*$/i, "")
    .trim();
}

function groupByDay(
  events: CalendarEvent[]
): Array<{ ymd: string; events: CalendarEvent[] }> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const ymd = wibYmd(e.ts);
    const list = map.get(ymd) ?? [];
    list.push(e);
    map.set(ymd, list);
  }
  return Array.from(map.entries())
    .map(([ymd, events]) => ({
      ymd,
      events: events.sort((a, b) => a.ts.localeCompare(b.ts)),
    }))
    .sort((a, b) => a.ymd.localeCompare(b.ymd));
}

const IMPACT_LABEL: Record<Impact, string> = {
  high: "High",
  medium: "Mod",
  low: "Low",
};

const IMPACT_STYLE: Record<Impact, string> = {
  high: "border-blood/60 bg-blood/20 text-[#fda4af]",
  medium: "border-amber/60 bg-amber/10 text-amber",
  low: "border-moss/60 bg-moss/10 text-moss",
};

function scoreStyle(n: number): string {
  if (n >= 9) return "bg-[#7f1d1d] text-[#fecaca]";
  if (n >= 8) return "bg-[#991b1b] text-[#fee2e2]";
  if (n >= 7) return "bg-[#b45309] text-[#fef3c7]";
  if (n >= 6) return "bg-[#b45309]/80 text-[#fef3c7]";
  if (n >= 5) return "bg-[#78350f] text-[#fef3c7]";
  if (n >= 4) return "bg-[#57330a] text-[#f5d478]";
  if (n >= 3) return "bg-[#3f6212] text-[#d9f99d]";
  if (n >= 2) return "bg-[#365314] text-[#d9f99d]";
  return "bg-[#1a2e05] text-[#a3e635]";
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

function parseViewMode(v: string | null): ViewMode {
  return v === "day" || v === "month" ? v : "week";
}
function parseImpact(v: string | null): ImpactFilter {
  return v === "high" || v === "medium" || v === "low" ? v : "all";
}
function parseRegion(v: string | null): RegionFilter {
  if (!v) return "all";
  return (REGIONS as ReadonlyArray<string>).includes(v)
    ? (v as RegionFilter)
    : "all";
}
function parseAnchor(v: string | null): string {
  if (!v) return DEMO_TODAY_YMD;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return DEMO_TODAY_YMD;
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarFallback />}>
      <CalendarView />
    </Suspense>
  );
}

function CalendarFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-amber">
        <span className="led amber" />
        DECODING CALENDAR
      </div>
    </div>
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
            Economic <span className="italic text-amber">Calendar</span>
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
                    ? "bg-amber text-ink"
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
              className="border border-ink-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-amber hover:text-amber"
            >
              ←
            </button>
            <div className="min-w-[180px] border border-amber/40 bg-ink-2/40 px-4 py-2 text-center">
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                {view === "day"
                  ? "Day"
                  : view === "week"
                  ? "Week"
                  : "Month"}
              </div>
              <div className="font-display text-base text-amber">
                {rangeLabel(view, anchor)}
              </div>
            </div>
            <button
              onClick={() => setAnchor(stepAnchor(view, anchor, 1))}
              aria-label={`Next ${view}`}
              className="border border-ink-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-amber hover:text-amber"
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
                  : "border-amber/60 text-amber hover:bg-amber hover:text-ink"
              )}
            >
              Today
            </button>
          </div>

          {/* Counts */}
          <div className="flex items-center justify-end gap-3 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
            <span className="text-amber">{filtered.length}</span>
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
                <div className="pointer-events-auto max-w-md border border-amber bg-ink-2/95 p-6 text-center shadow-[0_0_60px_rgba(245,158,11,0.18)] backdrop-blur">
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
                        className="border border-amber/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-amber hover:bg-amber hover:text-ink"
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
                          : "border-amber/60 text-amber hover:bg-amber hover:text-ink"
                      )}
                    >
                      Today
                    </button>
                    {nearestEventDate.forward && (
                      <button
                        onClick={() => jumpToNearest(1)}
                        className="border border-amber/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-amber hover:bg-amber hover:text-ink"
                      >
                        Next event →
                      </button>
                    )}
                    {filtersActive && (
                      <button
                        onClick={resetFilters}
                        className="border border-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-amber hover:text-amber"
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
            <div className="sticky top-0 z-20 grid grid-cols-[minmax(220px,2fr)_72px_64px_repeat(7,minmax(36px,1fr))] items-center gap-3 border-b-2 border-amber/40 bg-ink-2/95 px-3 py-2 backdrop-blur">
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
                  className="text-center font-mono text-[10px] uppercase tracking-widest2 text-amber"
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
                      className="border border-amber/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-amber hover:bg-amber hover:text-ink"
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
                        : "border-amber/60 text-amber hover:bg-amber hover:text-ink"
                    )}
                  >
                    Today
                  </button>
                  {nearestEventDate.forward && (
                    <button
                      onClick={() => jumpToNearest(1)}
                      className="border border-amber/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-amber hover:bg-amber hover:text-ink"
                    >
                      Next event · {formatDayHeader(nearestEventDate.forward)} →
                    </button>
                  )}
                  {filtersActive && (
                    <button
                      onClick={resetFilters}
                      className="border border-ink-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-amber hover:text-amber"
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
                      <span className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
                        {formatDayHeader(ymd)}
                      </span>
                      <span className="h-px flex-1 bg-amber/20" />
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
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
                Impact pill
              </div>
              <div className="mt-1 text-xs text-paper/60">
                Overall market impact — High / Mod / Low. Applies to rates,
                equities, and FX in general.
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
                Currency scores
              </div>
              <div className="mt-1 text-xs text-paper/60">
                Per-currency reaction scoring, 0 – 9. Higher = more expected
                movement in that currency vs. all others.
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
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

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function FilterChips({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-px bg-ink-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 transition-colors",
            value === opt.value
              ? "bg-amber text-ink"
              : "bg-ink-2 text-paper/60 hover:text-paper"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function EventRow({
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
    <div className="group grid grid-cols-[minmax(220px,2fr)_72px_64px_repeat(7,minmax(36px,1fr))] items-center gap-3 border-b border-ink-3 bg-ink px-3 py-3 transition-colors hover:bg-ink-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <div className="font-display text-base leading-tight text-paper group-hover:text-amber">
            {event.title}
          </div>
          {related && (
            <Link
              href={`/app/news/${related.id}`}
              title={related.headline}
              className="border border-amber/40 bg-amber/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-amber hover:bg-amber hover:text-ink"
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

function ScoreCell({ value }: { value: number }) {
  return (
    <div
      className={
        "flex h-8 items-center justify-center font-mono text-sm font-semibold " +
        scoreStyle(value)
      }
      title={`Score ${value} / 9`}
    >
      {value}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Month grid
// ─────────────────────────────────────────────────────────────

const IMPACT_DOT: Record<Impact, string> = {
  high: "bg-[#991b1b] border-[#fda4af]",
  medium: "bg-amber border-amber",
  low: "bg-moss border-moss",
};

const MAX_EVENTS_IN_CELL = 3;

function MonthGrid({
  anchor,
  events,
  onPickDay,
}: {
  anchor: string;
  events: CalendarEvent[];
  onPickDay: (ymd: string) => void;
}) {
  const days = monthGridDays(anchor);
  const monthStart = startOfMonth(anchor);
  const monthPrefix = monthStart.slice(0, 7);

  // Events grouped by WIB day
  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const ymd = wibYmd(e.ts);
    const list = byDay.get(ymd) ?? [];
    list.push(e);
    byDay.set(ymd, list);
  }
  // Sort events inside each day by timestamp for consistent overflow
  for (const [, list] of byDay) {
    list.sort((a, b) => a.ts.localeCompare(b.ts));
  }

  const todayYmd = DEMO_TODAY_YMD;

  const weekdayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="border border-ink-3">
      {/* Weekday header row */}
      <div className="grid grid-cols-7 border-b-2 border-amber/40 bg-ink-2/95">
        {weekdayHeaders.map((w) => (
          <div
            key={w}
            className="px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest2 text-amber"
          >
            {w}
          </div>
        ))}
      </div>

      {/* 6 weeks × 7 days */}
      <div className="grid grid-cols-7">
        {days.map((ymd, i) => {
          const date = ymdToDate(ymd);
          const day = date.getUTCDate();
          const inMonth = ymd.slice(0, 7) === monthPrefix;
          const isToday = ymd === todayYmd;
          const isAnchor = ymd === anchor;
          const isWeekend = [5, 6].includes(i % 7);
          const dayEvents = byDay.get(ymd) ?? [];
          const overflow = Math.max(0, dayEvents.length - MAX_EVENTS_IN_CELL);

          return (
            <button
              key={ymd}
              onClick={() => onPickDay(ymd)}
              title={`${formatDayHeader(ymd)} — click to drill into day view`}
              className={cn(
                "group relative flex min-h-[110px] flex-col items-stretch border-b border-r border-ink-3 p-2 text-left transition-colors",
                i % 7 === 6 && "border-r-0",
                Math.floor(i / 7) === 5 && "border-b-0",
                inMonth
                  ? "bg-ink hover:bg-ink-2"
                  : "bg-ink-2/30 hover:bg-ink-2/60",
                // Non-anchor hover gets a faint amber preview outline
                !isAnchor && !isToday && "hover:ring-1 hover:ring-inset hover:ring-amber/30",
                // Anchor (keyboard cursor) — inset amber border, overridden
                // visually by the today ring below when they coincide.
                isAnchor && !isToday && "bg-amber/5 ring-2 ring-inset ring-amber/60",
                isToday && "ring-1 ring-inset ring-amber",
                isAnchor && isToday && "ring-2 ring-amber bg-amber/10"
              )}
            >
              {/* Day number */}
              <div className="flex items-baseline justify-between">
                <span
                  className={cn(
                    "font-mono text-[11px] font-semibold tracking-widest2",
                    isToday
                      ? "text-amber"
                      : isAnchor
                      ? "text-amber"
                      : inMonth
                      ? "text-paper/80"
                      : "text-paper/25",
                    isWeekend && inMonth && !isToday && !isAnchor && "text-paper/50"
                  )}
                >
                  {String(day).padStart(2, "0")}
                </span>
                {isToday && (
                  <span className="font-mono text-[8px] uppercase tracking-widest2 text-amber">
                    TODAY
                  </span>
                )}
                {!isToday && isAnchor && (
                  <span className="font-mono text-[8px] uppercase tracking-widest2 text-amber">
                    ● ANCHOR
                  </span>
                )}
                {!isToday && !isAnchor && dayEvents.length > 0 && (
                  <span className="font-mono text-[8px] uppercase tracking-widest2 text-paper/30">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event chips */}
              <div className="mt-1 flex-1 space-y-0.5">
                {dayEvents.slice(0, MAX_EVENTS_IN_CELL).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-1.5 overflow-hidden"
                    title={e.title}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 border",
                        IMPACT_DOT[e.impact]
                      )}
                    />
                    <span className="truncate font-mono text-[9px] uppercase tracking-widest2 text-paper/70 group-hover:text-paper">
                      {shortName(e.title)}
                    </span>
                  </div>
                ))}
                {overflow > 0 && (
                  <div className="font-mono text-[9px] uppercase tracking-widest2 text-amber/70">
                    +{overflow} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
