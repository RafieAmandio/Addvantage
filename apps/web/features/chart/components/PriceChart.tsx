"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type SeriesMarker,
  type SeriesMarkerBar,
  type SeriesMarkerBarPosition,
  type SeriesMarkerShape,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import { cn } from "@/lib/cn";

export interface Bar {
  /** ISO timestamp. Daily bars can also be 'YYYY-MM-DD'. */
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * Timeline-event dot overlaid on the chart. Kind drives shape/color so the
 * viewer can distinguish a tweet from a news item at a glance without a legend.
 */
export interface ChartMarker {
  /** Stable id — used by onMarkerClick to deref the source event. */
  id: string;
  /** ISO timestamp — converted via toChartTime() to the series time type. */
  time: string;
  kind: "news" | "tweet" | "macro" | "earnings" | "user_pin";
  /** Shown in the marker's hover tooltip (maps to SeriesMarker.text). */
  title?: string;
}

export interface PriceChartProps {
  bars: Bar[];
  /** "candlestick" (default) or "area". */
  seriesType?: "candlestick" | "area";
  /** Container height in px. Default 480. Width fills parent. */
  height?: number;
  /** Optional className for layout/spacing. */
  className?: string;
  /** Optional timeline-event dots rendered over the series. */
  markers?: ChartMarker[];
  /** Fires with the clicked marker's id when a marker dot is clicked. */
  onMarkerClick?: (id: string) => void;
}

/**
 * Per-kind visual style for timeline-event markers. Keep in sync with the
 * closed `TIMELINE_KINDS` set in `features/timeline/types.ts`.
 */
const MARKER_STYLE: Record<
  ChartMarker["kind"],
  {
    shape: SeriesMarkerShape;
    color: string;
    position: SeriesMarkerBarPosition;
  }
> = {
  news: { shape: "circle", color: "#4da6ff", position: "aboveBar" },
  tweet: { shape: "arrowDown", color: "#ff9a3d", position: "aboveBar" },
  macro: { shape: "circle", color: "#ef5350", position: "aboveBar" },
  earnings: { shape: "square", color: "#a78bfa", position: "aboveBar" },
  user_pin: { shape: "circle", color: "#9ca3af", position: "belowBar" },
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

const BG = "#0b0f14";
const GRID = "#202832";
const TEXT = "#e7ecef";
const ACCENT = "#c6ff4d";

export function PriceChart({
  bars,
  seriesType = "candlestick",
  height = 480,
  className,
  markers,
  onMarkerClick,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Keep the handler in a ref so the main effect doesn't have to re-run
  // (and rebuild the whole chart) when the parent re-creates the callback.
  const onMarkerClickRef = useRef<typeof onMarkerClick>(onMarkerClick);
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

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

    // Timeline-event dots. v5 moved markers to a plugin: createSeriesMarkers
    // returns an ISeriesMarkersPluginApi we detach() on teardown. Sorted by
    // time because the plugin requires monotonic ordering.
    const mappedMarkers: SeriesMarker<Time>[] = (markers ?? [])
      .map((m): SeriesMarkerBar<Time> => {
        const style = MARKER_STYLE[m.kind];
        return {
          time: toChartTime(m.time),
          position: style.position,
          shape: style.shape,
          color: style.color,
          ...(m.title ? { text: m.title } : {}),
          ...(m.id ? { id: m.id } : {}),
        };
      })
      .sort((a, b) => {
        const ta = typeof a.time === "number" ? a.time : Date.parse(String(a.time)) / 1000;
        const tb = typeof b.time === "number" ? b.time : Date.parse(String(b.time)) / 1000;
        return ta - tb;
      });
    const markersPlugin =
      mappedMarkers.length > 0 ? createSeriesMarkers(series, mappedMarkers) : null;

    // Marker click wiring. v5's plugin doesn't expose a per-marker click; the
    // documented path is chart.subscribeClick + MouseEventParams.hoveredObjectId,
    // which the createSeriesMarkers plugin populates with the marker's `id`.
    const clickHandler = (param: { hoveredObjectId?: unknown }) => {
      const cb = onMarkerClickRef.current;
      if (!cb) return;
      const id = param.hoveredObjectId;
      if (typeof id === "string" && id.length > 0) cb(id);
    };
    chart.subscribeClick(clickHandler);

    chart.timeScale().fitContent();

    return () => {
      chart.unsubscribeClick(clickHandler);
      markersPlugin?.detach();
      chart.remove();
    };
  }, [bars, seriesType, markers]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
      style={{ height }}
    />
  );
}

export default PriceChart;
