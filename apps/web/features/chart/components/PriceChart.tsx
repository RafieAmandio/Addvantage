"use client";

import { useEffect, useRef } from "react";
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

export interface Bar {
  /** ISO timestamp. Daily bars can also be 'YYYY-MM-DD'. */
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PriceChartProps {
  bars: Bar[];
  /** "candlestick" (default) or "area". */
  seriesType?: "candlestick" | "area";
  /** Container height in px. Default 480. Width fills parent. */
  height?: number;
  /** Optional className for layout/spacing. */
  className?: string;
}

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
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

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

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [bars, seriesType]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
      style={{ height }}
    />
  );
}

export default PriceChart;
