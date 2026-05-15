"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { cn } from "@/lib/cn";
import {
  getMockBars,
  getMockEvents,
  SYMBOLS,
  type MockEvent,
  type MockSymbol,
  type Timeframe,
} from "@/features/dashboard/lib/mock-chart-data";
import type { TimelineKind } from "@/features/timeline/types";

const CHART_HEIGHT = 320;

const BG = "transparent";
const GRID = "rgba(255,255,255,0.04)";
const TEXT = "rgba(255,255,255,0.4)";
const UP = "#FFD400";
const DOWN = "#ef5350";

const KIND_CONFIG: Record<
  TimelineKind,
  { color: string; label: string; glyph: string }
> = {
  news: { color: "#4da6ff", label: "News", glyph: "N" },
  tweet: { color: "#ff9a3d", label: "Tweets", glyph: "T" },
  macro: { color: "#ef5350", label: "Macro", glyph: "M" },
  earnings: { color: "#a78bfa", label: "Earnings", glyph: "E" },
  user_pin: { color: "#9ca3af", label: "Pins", glyph: "•" },
};

const FILTER_KINDS: TimelineKind[] = [
  "news",
  "macro",
  "tweet",
  "earnings",
];

function toChartTime(iso: string): Time {
  if (iso.length === 10 && iso[4] === "-" && iso[7] === "-") {
    return iso as Time;
  }
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso as Time;
  return Math.floor(ms / 1000) as UTCTimestamp;
}

function toEpochSec(iso: string): number {
  if (iso.length === 10 && iso[4] === "-" && iso[7] === "-") {
    return Date.parse(`${iso}T00:00:00Z`) / 1000;
  }
  return Date.parse(iso) / 1000;
}

function formatClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MarkerLayout {
  x: number;
  y: number;
  chartHeight: number;
  events: MockEvent[];
  primaryKind: TimelineKind;
}

const GROUP_THRESHOLD_PX = 24;

function groupMarkers(
  raw: Array<{ x: number; y: number; event: MockEvent }>,
  chartHeight: number,
): MarkerLayout[] {
  if (raw.length === 0) return [];
  const sorted = [...raw].sort((a, b) => a.x - b.x);
  const groups: MarkerLayout[] = [];
  let current: MarkerLayout = {
    x: sorted[0].x,
    y: sorted[0].y,
    chartHeight,
    events: [sorted[0].event],
    primaryKind: sorted[0].event.kind,
  };

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.x - current.x) <= GROUP_THRESHOLD_PX) {
      current.events.push(item.event);
      current.x = (current.x + item.x) / 2;
      current.y = Math.min(current.y, item.y);
    } else {
      groups.push(current);
      current = {
        x: item.x,
        y: item.y,
        chartHeight,
        events: [item.event],
        primaryKind: item.event.kind,
      };
    }
  }
  groups.push(current);
  return groups;
}

export function DashboardEventChart() {
  const router = useRouter();
  const [symbol, setSymbol] = useState<MockSymbol>("NVDA");
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [activeKinds, setActiveKinds] = useState<Set<TimelineKind>>(
    () => new Set(FILTER_KINDS),
  );
  const [layoutTick, setLayoutTick] = useState(0);

  const bars = useMemo(() => getMockBars(symbol, timeframe), [symbol, timeframe]);
  const allEvents = useMemo(() => getMockEvents(bars), [bars]);
  const events = useMemo(
    () => allEvents.filter((e) => activeKinds.has(e.kind)),
    [allEvents, activeKinds],
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const toggleKind = useCallback((kind: TimelineKind) => {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: BG },
        textColor: TEXT,
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: GRID },
        horzLines: { color: GRID },
      },
      rightPriceScale: {
        borderColor: "transparent",
        scaleMargins: { top: 0.12, bottom: 0.08 },
      },
      timeScale: {
        borderColor: "transparent",
        timeVisible: timeframe === "1D" || timeframe === "1W",
        secondsVisible: false,
      },
      crosshair: { mode: 1 },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      downColor: DOWN,
      borderVisible: false,
      wickUpColor: UP,
      wickDownColor: DOWN,
    });

    series.setData(
      bars.map((b) => ({
        time: toChartTime(b.time),
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      })),
    );

    chartRef.current = chart;
    seriesRef.current = series;

    const bump = () => setLayoutTick((t) => t + 1);
    chart.timeScale().subscribeVisibleTimeRangeChange(bump);
    chart.timeScale().subscribeSizeChange(bump);
    chart.timeScale().fitContent();

    const r1 = requestAnimationFrame(() => {
      bump();
      requestAnimationFrame(bump);
    });
    const t1 = setTimeout(bump, 80);
    const t2 = setTimeout(bump, 250);

    return () => {
      cancelAnimationFrame(r1);
      clearTimeout(t1);
      clearTimeout(t2);
      chart.timeScale().unsubscribeVisibleTimeRangeChange(bump);
      chart.timeScale().unsubscribeSizeChange(bump);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [bars, timeframe]);

  const markerGroups = useMemo(() => {
    void layoutTick;
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series || events.length === 0) return [];

    const barIndex = bars
      .map((b) => ({ bar: b, t: toEpochSec(b.time) }))
      .sort((a, b) => a.t - b.t);
    if (barIndex.length === 0) return [];

    const raw: Array<{ x: number; y: number; event: MockEvent }> = [];

    for (const ev of events) {
      const t = toEpochSec(ev.time);
      let best = barIndex[0];
      let bestDiff = Math.abs(barIndex[0].t - t);
      for (let i = 1; i < barIndex.length; i++) {
        const d = Math.abs(barIndex[i].t - t);
        if (d < bestDiff) {
          best = barIndex[i];
          bestDiff = d;
        }
      }

      const x = chart.timeScale().timeToCoordinate(toChartTime(best.bar.time));
      if (x === null) continue;
      const priceY = series.priceToCoordinate(best.bar.high);
      if (priceY === null) continue;
      raw.push({ x, y: priceY - 20, event: ev });
    }

    return groupMarkers(raw, CHART_HEIGHT);
  }, [events, bars, layoutTick]);

  const handleEventClick = useCallback(
    (ev: MockEvent) => {
      if (ev.newsItemId) {
        router.push(`/app/news/${ev.newsItemId}`);
      } else if (ev.kind === "macro") {
        router.push("/app/calendar");
      } else {
        router.push("/app/news");
      }
    },
    [router],
  );

  return (
    <section aria-label="Price chart" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <ChartToolbar
          symbol={symbol}
          onSymbolChange={setSymbol}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          activeKinds={activeKinds}
          onToggleKind={toggleKind}
          eventCount={events.length}
        />

        <div className="relative" style={{ height: CHART_HEIGHT }}>
          <div ref={containerRef} className="absolute inset-0" />

          <div className="pointer-events-none absolute inset-0 z-10">
            {markerGroups.map((group, i) => (
              <MarkerDot
                key={i}
                group={group}
                onEventClick={handleEventClick}
              />
            ))}
          </div>

          {events.length === 0 && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <span className="text-xs text-white/50">
                No events in this range
              </span>
            </div>
          )}

          {/* Zoom reset */}
          <button
            onClick={() => chartRef.current?.timeScale().fitContent()}
            className="absolute bottom-3 right-3 z-20 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[11px] text-white/50 opacity-0 transition-opacity hover:bg-white/[0.1] hover:text-white/70 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none [div:hover>&]:opacity-100"
            title="Reset zoom"
          >
            Fit
          </button>
        </div>
      </div>
    </section>
  );
}

function ChartToolbar({
  symbol,
  onSymbolChange,
  timeframe,
  onTimeframeChange,
  activeKinds,
  onToggleKind,
  eventCount,
}: {
  symbol: MockSymbol;
  onSymbolChange: (s: MockSymbol) => void;
  timeframe: Timeframe;
  onTimeframeChange: (t: Timeframe) => void;
  activeKinds: Set<TimelineKind>;
  onToggleKind: (k: TimelineKind) => void;
  eventCount: number;
}) {
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [symbolQuery, setSymbolQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();

  const filtered = useMemo(() => {
    const q = symbolQuery.trim().toUpperCase();
    if (!q) return [...SYMBOLS];
    return SYMBOLS.filter((s) => s.includes(q));
  }, [symbolQuery]);

  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(0);
  }, [filtered.length, activeIdx]);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.04] px-4 py-3">
      {/* Symbol selector */}
      <div className="relative">
        <button
          onClick={() => {
            setSymbolOpen((v) => !v);
            if (!symbolOpen) {
              requestAnimationFrame(() => inputRef.current?.focus());
            }
          }}
          aria-expanded={symbolOpen}
          aria-haspopup="listbox"
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/[0.08]"
        >
          {symbol}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-white/40"
          >
            <path d="M2.5 4L5 6.5L7.5 4" />
          </svg>
        </button>

        {symbolOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setSymbolOpen(false)}
            />
            <div className="absolute left-0 top-full z-40 mt-1 w-40 rounded-xl border border-white/[0.08] bg-black-2 p-1 shadow-xl shadow-black/40">
              <input
                ref={inputRef}
                type="text"
                value={symbolQuery}
                onChange={(e) => {
                  setSymbolQuery(e.target.value);
                  setActiveIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIdx((i) =>
                      filtered.length ? (i + 1) % filtered.length : 0,
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIdx((i) =>
                      filtered.length
                        ? (i - 1 + filtered.length) % filtered.length
                        : 0,
                    );
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    const pick = filtered[activeIdx];
                    if (pick) {
                      onSymbolChange(pick);
                      setSymbolOpen(false);
                      setSymbolQuery("");
                    }
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setSymbolOpen(false);
                    setSymbolQuery("");
                  }
                }}
                placeholder="Search..."
                aria-label="Search symbols"
                aria-autocomplete="list"
                aria-controls={listboxId}
                className="w-full rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-white placeholder:text-white/50 outline-none"
              />
              <ul
                id={listboxId}
                role="listbox"
                className="mt-1 max-h-48 overflow-y-auto"
              >
                {filtered.map((s, idx) => (
                  <li
                    key={s}
                    role="option"
                    aria-selected={idx === activeIdx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSymbolChange(s);
                      setSymbolOpen(false);
                      setSymbolQuery("");
                    }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={cn(
                      "cursor-pointer rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                      idx === activeIdx
                        ? "bg-brand text-black"
                        : s === symbol
                          ? "text-brand"
                          : "text-white/70 hover:bg-white/[0.04]",
                    )}
                  >
                    {s}
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="px-2.5 py-1.5 text-xs text-white/50">
                    No match
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Timeframe toggle */}
      <div className="flex gap-0.5 rounded-lg bg-white/[0.03] p-0.5" role="radiogroup" aria-label="Timeframe">
        {(["1D", "1W", "1M"] as const).map((tf) => (
          <button
            key={tf}
            role="radio"
            aria-checked={timeframe === tf}
            onClick={() => onTimeframeChange(tf)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              timeframe === tf
                ? "bg-white/[0.1] text-white"
                : "text-white/50 hover:text-white/70",
            )}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-white/[0.06]" aria-hidden />

      {/* Event type filters */}
      <div className="flex flex-wrap gap-1" role="group" aria-label="Event type filters">
        {FILTER_KINDS.map((kind) => {
          const cfg = KIND_CONFIG[kind];
          const active = activeKinds.has(kind);
          return (
            <button
              key={kind}
              aria-pressed={active}
              onClick={() => onToggleKind(kind)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                active
                  ? "bg-white/[0.06] text-white/80"
                  : "text-white/40 hover:text-white/60",
              )}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: active ? cfg.color : "rgba(255,255,255,0.15)" }}
              />
              {cfg.label}
            </button>
          );
        })}
      </div>

      <span className="ml-auto text-[11px] text-white/40">
        {eventCount} {eventCount === 1 ? "event" : "events"}
      </span>
    </div>
  );
}

function MarkerDot({
  group,
  onEventClick,
}: {
  group: MarkerLayout;
  onEventClick: (ev: MockEvent) => void;
}) {
  const { x, y, chartHeight, events: evts } = group;
  const isGroup = evts.length > 1;
  const primary = evts[0];
  const cfg = KIND_CONFIG[primary.kind];

  const highestImpact = evts.some((e) => e.impact === "high")
    ? "high"
    : evts.some((e) => e.impact === "medium")
      ? "medium"
      : "low";

  const lineTop = y + 14;
  const lineHeight = Math.max(0, chartHeight - lineTop);

  return (
    <>
      {/* Vertical event line */}
      <div
        className="pointer-events-none absolute z-[1] transition-opacity duration-150"
        style={{
          left: `${x}px`,
          top: `${lineTop}px`,
          width: 1,
          height: `${lineHeight}px`,
          background: `linear-gradient(to bottom, ${cfg.color}33, ${cfg.color}08)`,
        }}
      />

      {/* Marker dot + tooltip */}
      <div
        className="group pointer-events-auto absolute z-[2]"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="relative flex h-7 w-7 items-center justify-center">
          {highestImpact === "high" && (
            <span
              className="absolute h-5 w-5 animate-ping rounded-full opacity-20 motion-reduce:animate-none"
              style={{ background: cfg.color }}
            />
          )}

          <span
            className="relative z-10 flex items-center justify-center rounded-full text-[8px] font-bold text-black shadow-sm transition-transform duration-150 group-hover:scale-150"
            style={{
              background: cfg.color,
              width: isGroup ? 20 : 14,
              height: isGroup ? 20 : 14,
            }}
          >
            {isGroup ? evts.length : cfg.glyph}
          </span>
        </div>

        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          <div className="w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-white/[0.08] bg-black-2 p-3 shadow-xl shadow-black/50">
            {evts.length === 1 ? (
              <SingleEventTooltip event={primary} onClick={() => onEventClick(primary)} />
            ) : (
              <GroupedEventTooltip events={evts} onEventClick={onEventClick} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SingleEventTooltip({
  event,
  onClick,
}: {
  event: MockEvent;
  onClick: () => void;
}) {
  const cfg = KIND_CONFIG[event.kind];
  return (
    <button
      onClick={onClick}
      className="w-full text-left focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium" style={{ color: cfg.color }}>
          {cfg.label}
          {event.sourceCode ? ` · ${event.sourceCode}` : ""}
        </span>
        <span className="text-[11px] text-white/50">{formatClock(event.time)}</span>
      </div>
      <div className="text-sm font-medium leading-snug text-white">
        {event.title}
      </div>
      {event.body && (
        <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/50">
          {event.body}
        </div>
      )}
      {(event.impact || event.bias) && (
        <div className="mt-2 flex items-center gap-1.5">
          {event.impact && (
            <span
              className={cn(
                "rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px]",
                event.impact === "high"
                  ? "text-blood-bright"
                  : event.impact === "medium"
                    ? "text-brand"
                    : "text-white/50",
              )}
            >
              {event.impact}
            </span>
          )}
          {event.bias && (
            <span
              className={cn(
                "rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px]",
                event.bias === "bullish"
                  ? "text-brand"
                  : event.bias === "bearish"
                    ? "text-blood-bright"
                    : "text-white/50",
              )}
            >
              {event.bias}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function GroupedEventTooltip({
  events,
  onEventClick,
}: {
  events: MockEvent[];
  onEventClick: (ev: MockEvent) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-medium text-white/50">
        {events.length} events at this point
      </div>
      <div className="space-y-1">
        {events.map((ev) => {
          const cfg = KIND_CONFIG[ev.kind];
          return (
            <button
              key={ev.id}
              onClick={() => onEventClick(ev)}
              className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04] focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              <span
                className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[7px] font-bold text-black"
                style={{ background: cfg.color }}
              >
                {cfg.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-white">
                  {ev.title}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span style={{ color: cfg.color }}>{cfg.label}</span>
                  {ev.impact && (
                    <>
                      <span>·</span>
                      <span
                        className={cn(
                          ev.impact === "high"
                            ? "text-blood-bright"
                            : ev.impact === "medium"
                              ? "text-brand"
                              : "text-white/50",
                        )}
                      >
                        {ev.impact}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
