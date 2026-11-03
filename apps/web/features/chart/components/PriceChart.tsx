"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import { cn } from "@/lib/cn";
import { BiasBadge, ImpactPill } from "@/components/ui/Marker";

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

interface PriceChartProps {
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
  news: { color: "#FFFFFF", position: "aboveBar", glyph: "N" },
  tweet: { color: "rgba(255,255,255,0.6)", position: "aboveBar", glyph: "T" },
  macro: { color: "#FFD400", position: "aboveBar", glyph: "M" },
  earnings: { color: "rgba(255,255,255,0.6)", position: "aboveBar", glyph: "E" },
  user_pin: { color: "rgba(255,255,255,0.4)", position: "belowBar", glyph: "•" },
};

const KIND_LABEL: Record<ChartMarker["kind"], string> = {
  news: "News",
  tweet: "Tweet",
  macro: "Macro",
  earnings: "Earnings",
  user_pin: "Pin",
};

function toChartTime(iso: string): Time {
  if (iso.length === 10 && iso[4] === "-" && iso[7] === "-") {
    return iso as Time;
  }
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    return iso as Time;
  }
  return Math.floor(ms / 1000) as UTCTimestamp;
}

const BG = "#121212";
const GRID = "rgba(255,255,255,0.12)";
const TEXT = "rgba(255,255,255,0.55)";
const ACCENT = "#FFD400";
const UP = "#00DD94";
const DOWN = "#FF454D";

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
  const [layoutTick, setLayoutTick] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart: IChartApi = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: BG },
        textColor: TEXT,
        fontFamily: "Geist, sans-serif",
        fontSize: 12,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: GRID, style: LineStyle.SparseDotted },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      crosshair: {
        mode: 1,
        vertLine: { color: "rgba(255,255,255,0.3)", labelBackgroundColor: "#1A1A1A" },
        horzLine: { color: "rgba(255,255,255,0.3)", labelBackgroundColor: "#1A1A1A" },
      },
    });

    let series: ISeriesApi<"Candlestick"> | ISeriesApi<"Area">;
    if (seriesType === "area") {
      series = chart.addSeries(AreaSeries, {
        lineColor: ACCENT,
        lineWidth: 2,
        topColor: "transparent",
        bottomColor: "transparent",
      });
      series.setData(
        bars.map((b) => ({ time: toChartTime(b.time), value: b.close }))
      );
    } else {
      series = chart.addSeries(CandlestickSeries, {
        upColor: UP,
        downColor: DOWN,
        borderVisible: false,
        wickUpColor: UP,
        wickDownColor: DOWN,
        priceLineColor: "rgba(255,255,255,0.5)",
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

    const bumpLayout = () => setLayoutTick((t) => t + 1);
    chart.timeScale().subscribeVisibleTimeRangeChange(bumpLayout);
    chart.timeScale().subscribeSizeChange(bumpLayout);

    chart.timeScale().fitContent();
    // Chart painting is async; repeated bumps ensure coordinates resolve after resize+paint.
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

  const markerLayouts: MarkerLayout[] = useMemo(() => {
    void layoutTick;
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series || !markers || markers.length === 0) return [];

    const barIndex = bars
      .map((b) => ({ bar: b, t: toEpochSec(b.time) }))
      .sort((a, b) => a.t - b.t);
    if (barIndex.length === 0) return [];

    const layouts: MarkerLayout[] = [];
    for (const m of markers) {
      const t = toEpochSec(m.time);
      const near = nearestBar(barIndex, t);
      // timeToCoordinate only resolves for times in the data set.
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
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span
        className="pointer-events-none flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-black transition-transform duration-150 group-hover:scale-[1.6]"
        style={{ background: style.color }}
      >
        {style.glyph}
      </span>

      <div
        className={cn(
          "absolute left-1/2 z-30 hidden w-72 max-w-[calc(100vw-32px)] -translate-x-1/2 group-hover:block",
          cardAbove ? "bottom-full mb-2" : "top-full mt-2"
        )}
      >
        <div className="rounded-xl bg-raised p-3 ring-1 ring-white/[0.08]">
          <div className="mb-1 flex items-center justify-between gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
            <span>
              {KIND_LABEL[marker.kind]}
              {marker.sourceCode ? ` · ${marker.sourceCode}` : ""}
            </span>
            <span className="font-normal normal-case tracking-normal">{formatClock(marker.time)}</span>
          </div>
          {marker.title && <div className="text-[14px] font-semibold leading-5 text-white">{marker.title}</div>}
          {marker.body && <div className="mt-1 line-clamp-3 text-[13px] leading-[18px] text-white/55">{marker.body}</div>}
          {(marker.impact || marker.bias) && (
            <div className="mt-2 flex items-center gap-3">
              {marker.impact && <ImpactPill level={marker.impact} />}
              {marker.bias && <BiasBadge bias={marker.bias} />}
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
