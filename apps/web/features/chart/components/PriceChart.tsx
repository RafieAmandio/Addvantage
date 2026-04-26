"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import { cn } from "@/lib/cn";

type MarkerPosition = "aboveBar" | "belowBar";

export interface Bar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ChartMarker {
  id: string;
  time: string;
  kind: "news" | "tweet" | "macro" | "earnings" | "user_pin";
  title?: string;
  sourceCode?: string | null;
  body?: string | null;
  bias?: "bullish" | "bearish" | "neutral" | null;
  impact?: "high" | "medium" | "low" | null;
}

export interface PriceChartProps {
  bars: Bar[];
  seriesType?: "candlestick" | "area";
  height?: number;
  className?: string;
  markers?: ChartMarker[];
  onMarkerClick?: (id: string) => void;
}

const MARKER_STYLE: Record<
  ChartMarker["kind"],
  { color: string; position: MarkerPosition; glyph: string }
> = {
  news: { color: "#4da6ff", position: "aboveBar", glyph: "N" },
  tweet: { color: "#ff9a3d", position: "aboveBar", glyph: "T" },
  macro: { color: "#ef5350", position: "aboveBar", glyph: "M" },
  earnings: { color: "#a78bfa", position: "aboveBar", glyph: "E" },
  user_pin: { color: "#9ca3af", position: "belowBar", glyph: "•" },
};

const KIND_LABEL: Record<ChartMarker["kind"], string> = {
  news: "NEWS",
  tweet: "TWEET",
  macro: "MACRO",
  earnings: "EARNINGS",
  user_pin: "PIN",
};

// Lightweight Charts v5 accepts 'YYYY-MM-DD' strings for daily bars and
// UTCTimestamp (seconds since epoch) for intraday. Anything with a time
// component gets converted to epoch seconds; pure dates pass through.
function toChartTime(iso: string): Time {
  if (iso.length === 10 && iso[4] === "-" && iso[7] === "-") {
    return iso as Time;
  }
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    // Fallback: trust the caller — Lightweight Charts will throw if invalid.
    return iso as Time;
  }
  return Math.floor(ms / 1000) as UTCTimestamp;
}

const BG = "#111111";
const GRID = "#1F1F1F";
const TEXT = "#EEEEEE";
const ACCENT = "#FFD400";

interface MarkerLayout {
  id: string;
  x: number;
  y: number;
  marker: ChartMarker;
}

export function PriceChart({
  bars,
  seriesType = "candlestick",
  height = 480,
  className,
  markers,
  onMarkerClick,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Area"> | null>(null);
  // Bumped whenever the visible range changes or the chart rebuilds, to
  // force the marker-overlay layout to recompute against fresh coordinates.
  const [layoutTick, setLayoutTick] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart: IChartApi = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: BG },
        textColor: TEXT,
      },
      grid: {
        vertLines: { color: GRID },
        horzLines: { color: GRID },
      },
      rightPriceScale: { borderColor: GRID },
      timeScale: { borderColor: GRID, timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
    });

    let series: ISeriesApi<"Candlestick"> | ISeriesApi<"Area">;
    if (seriesType === "area") {
      series = chart.addSeries(AreaSeries, {
        lineColor: ACCENT,
        topColor: `${ACCENT}55`,
        bottomColor: `${ACCENT}00`,
      });
      series.setData(
        bars.map((b) => ({ time: toChartTime(b.time), value: b.close }))
      );
    } else {
      series = chart.addSeries(CandlestickSeries, {
        upColor: ACCENT,
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: ACCENT,
        wickDownColor: "#ef5350",
      });
      series.setData(
        bars.map((b) => ({
          time: toChartTime(b.time),
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        }))
      );
    }

    chartRef.current = chart;
    seriesRef.current = series;

    // Recompute overlay coordinates whenever the visible range shifts (pan,
    // zoom, fit) or the data rebuilds. One state-bump drives the whole layer.
    const bumpLayout = () => setLayoutTick((t) => t + 1);
    chart.timeScale().subscribeVisibleTimeRangeChange(bumpLayout);
    chart.timeScale().subscribeSizeChange(bumpLayout);

    chart.timeScale().fitContent();
    // Bump layout repeatedly over the first ~200ms. Chart painting and
    // coordinate resolution is async and its timing isn't fully observable
    // through the public API; a few cheap bumps guarantee we land after the
    // ResizeObserver has delivered dimensions and the pane has painted.
    const rafs: number[] = [];
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    rafs.push(
      requestAnimationFrame(() => {
        bumpLayout();
        rafs.push(requestAnimationFrame(bumpLayout));
      })
    );
    timeouts.push(setTimeout(bumpLayout, 50));
    timeouts.push(setTimeout(bumpLayout, 200));

    return () => {
      rafs.forEach(cancelAnimationFrame);
      timeouts.forEach(clearTimeout);
      chart.timeScale().unsubscribeVisibleTimeRangeChange(bumpLayout);
      chart.timeScale().unsubscribeSizeChange(bumpLayout);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [bars, seriesType]);

  // Per-marker pixel coordinates, rebuilt on every layout tick. The native
  // dots are drawn by the lightweight-charts plugin; these coordinates power
  // a sibling HTML layer that renders invisible hover hitboxes + an expanded
  // card on hover.
  const markerLayouts: MarkerLayout[] = useMemo(() => {
    void layoutTick; // dep — re-run when the chart tells us to
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series || !markers || markers.length === 0) return [];

    // Bar times as epoch seconds, once, so per-marker nearest-bar lookup is
    // cheap. Chart coordinates come from timeScale.timeToCoordinate(time) +
    // the nearest bar's high/low for the vertical pin.
    const barIndex = bars
      .map((b) => ({ bar: b, t: toEpochSec(b.time) }))
      .sort((a, b) => a.t - b.t);
    if (barIndex.length === 0) return [];

    const layouts: MarkerLayout[] = [];
    for (const m of markers) {
      const t = toEpochSec(m.time);
      const near = nearestBar(barIndex, t);
      // Snap to the nearest bar's time — timeToCoordinate resolves reliably
      // only for times that match the data set, not arbitrary timestamps
      // between bars. One-hour snap granularity is imperceptible at the
      // default zoom.
      const x = chart.timeScale().timeToCoordinate(toChartTime(near.time));
      if (x === null) continue;

      const style = MARKER_STYLE[m.kind];
      const price = style.position === "belowBar" ? near.low : near.high;
      const priceY = series.priceToCoordinate(price);
      if (priceY === null) continue;
      const y =
        style.position === "belowBar" ? priceY + 18 : priceY - 18;

      layouts.push({ id: m.id, x, y, marker: m });
    }
    return layouts;
  }, [markers, bars, layoutTick]);

  return (
    <div className={cn("relative w-full", className)} style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 z-10">
        {markerLayouts.map((l) => (
          <MarkerHoverCard
            key={l.id}
            layout={l}
            onClick={
              onMarkerClick ? () => onMarkerClick(l.id) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

function MarkerHoverCard({
  layout,
  onClick,
}: {
  layout: MarkerLayout;
  onClick?: () => void;
}) {
  const { x, y, marker } = layout;
  const style = MARKER_STYLE[marker.kind];
  // Dot is 14px; hitbox is 28px (doubled for forgiving hover). Card flips
  // to the other side of the anchor so it never covers the candles.
  const cardAbove = style.position === "aboveBar";
  return (
    <div
      className="group pointer-events-auto absolute flex items-center justify-center"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: 28,
        height: 28,
        transform: "translate(-50%, -50%)",
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span
        className="pointer-events-none flex h-3.5 w-3.5 items-center justify-center rounded-full font-mono text-[8px] font-bold text-black shadow transition-transform duration-150 group-hover:scale-[1.6]"
        style={{ background: style.color }}
      >
        {style.glyph}
      </span>

      <div
        className={cn(
          "pointer-events-none absolute left-1/2 z-30 w-72 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100",
          cardAbove ? "bottom-full mb-2" : "top-full mt-2"
        )}
      >
        <div
          className="border border-gray-3 bg-gray-2 p-3 shadow-lg shadow-black/50"
          style={{ borderLeft: `2px solid ${style.color}` }}
        >
          <div className="mb-1 flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-widest2 text-white/50">
            <span style={{ color: style.color }}>
              {KIND_LABEL[marker.kind]}
              {marker.sourceCode ? ` · ${marker.sourceCode}` : ""}
            </span>
            <span>{formatClock(marker.time)}</span>
          </div>
          {marker.title && (
            <div className="font-display text-sm text-white">
              {marker.title}
            </div>
          )}
          {marker.body && (
            <div className="mt-1.5 line-clamp-3 text-xs text-white/60">
              {marker.body}
            </div>
          )}
          {(marker.impact || marker.bias) && (
            <div className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest2">
              {marker.impact && (
                <span
                  className={cn(
                    "border px-1.5 py-0.5",
                    marker.impact === "high"
                      ? "border-blood/60 text-red-500"
                      : marker.impact === "medium"
                      ? "border-brand/60 text-brand"
                      : "border-gray-3 text-white/50"
                  )}
                >
                  {marker.impact}
                </span>
              )}
              {marker.bias && (
                <span
                  className={cn(
                    "border px-1.5 py-0.5",
                    marker.bias === "bullish"
                      ? "border-brand/60 text-brand"
                      : marker.bias === "bearish"
                      ? "border-blood/60 text-red-500"
                      : "border-gray-3 text-white/50"
                  )}
                >
                  {marker.bias}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function toEpochSec(iso: string): number {
  if (iso.length === 10 && iso[4] === "-" && iso[7] === "-") {
    return Date.parse(`${iso}T00:00:00Z`) / 1000;
  }
  return Date.parse(iso) / 1000;
}

function nearestBar(
  index: Array<{ bar: Bar; t: number }>,
  t: number
): Bar {
  // Binary search would shave cycles but O(n) is fine at n≈5000 × ≤50 markers.
  let best = index[0];
  let bestDiff = Math.abs(index[0].t - t);
  for (let i = 1; i < index.length; i++) {
    const d = Math.abs(index[i].t - t);
    if (d < bestDiff) {
      best = index[i];
      bestDiff = d;
    }
  }
  return best.bar;
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
