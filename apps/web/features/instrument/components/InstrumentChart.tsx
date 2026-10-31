"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type AutoscaleInfo,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Bar } from "@/features/chart/components/PriceChart";

export interface ChartLevel {
  price: number;
  label: string;
  kind: "plan" | "stop" | "target" | "atr" | "prev" | "method";
}

/** Labelled marker on one candle, for explaining a setup on the chart. */
export interface ChartNote {
  time: string;
  text: string;
  position: "aboveBar" | "belowBar";
  color: string;
}

export interface ChartPin {
  time: string;
  kind: "news" | "macro";
  bias?: "bullish" | "bearish" | "neutral";
}

const LEVEL_STYLE: Record<ChartLevel["kind"], { color: string; style: LineStyle }> = {
  plan: { color: "#FFD400", style: LineStyle.Solid },
  stop: { color: "#FF454D", style: LineStyle.Solid },
  target: { color: "#00DD94", style: LineStyle.Solid },
  atr: { color: "rgba(255,212,0,.55)", style: LineStyle.Dashed },
  prev: { color: "rgba(255,255,255,.45)", style: LineStyle.Dotted },
  method: { color: "rgba(255,255,255,.8)", style: LineStyle.Dashed },
};

const sec = (iso: string) => Math.floor(Date.parse(iso) / 1000) as UTCTimestamp;

/** Candles with the desk's levels drawn on: plan, ATR band, previous day high/low, news and macro pins. */
export function InstrumentChart({
  bars,
  levels,
  pins,
  notes = [],
  focusFrom,
  height = 460,
}: {
  bars: Bar[];
  levels: ChartLevel[];
  pins: ChartPin[];
  notes?: ChartNote[];
  /** Zoom to start a few candles before this time instead of fitting everything. */
  focusFrom?: string;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || bars.length === 0) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "#121212" }, textColor: "rgba(255,255,255,.55)", fontFamily: "Geist, sans-serif", fontSize: 12, attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { color: "rgba(255,255,255,.12)", style: LineStyle.SparseDotted } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      crosshair: { mode: 0, vertLine: { color: "rgba(255,255,255,.3)", labelBackgroundColor: "#1A1A1A" }, horzLine: { color: "rgba(255,255,255,.3)", labelBackgroundColor: "#1A1A1A" } },
    });
    const ref0 = bars.at(-1)!.close;
    const prec = ref0 >= 1000 ? 2 : ref0 >= 10 ? 3 : 5;
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#00DD94",
      downColor: "#FF454D",
      borderVisible: false,
      wickUpColor: "#00DD94",
      wickDownColor: "#FF454D",
      priceLineColor: "rgba(255,255,255,.5)",
      // Full instrument precision on the axis and level labels: 5 dp FX, 3 dp yen, 2 dp metals and indices.
      priceFormat: { type: "price", precision: prec, minMove: 10 ** -prec },
      // Keep plan entry/stop/targets on screen; ATR and PDH/PDL may sit outside the view.
      autoscaleInfoProvider: (base: () => AutoscaleInfo | null) => {
        const r = base();
        const plan = levels.filter((l) => l.kind !== "atr" && l.kind !== "prev").map((l) => l.price);
        if (!r?.priceRange || plan.length === 0) return r;
        return { ...r, priceRange: { minValue: Math.min(r.priceRange.minValue, ...plan), maxValue: Math.max(r.priceRange.maxValue, ...plan) } };
      },
    });
    series.setData(bars.map((b) => ({ time: sec(b.time), open: b.open, high: b.high, low: b.low, close: b.close })));

    for (const l of levels) {
      const s = LEVEL_STYLE[l.kind];
      series.createPriceLine({ price: l.price, color: s.color, lineStyle: s.style, lineWidth: 1, title: l.label, axisLabelVisible: true });
    }

    // Snap each pin to the bar it falls in; lightweight-charts drops times that aren't in the data.
    const times = bars.map((b) => sec(b.time));
    const snap = (t: number) => {
      let best = times[0]!;
      for (const x of times) if (x <= t) best = x;
      return best;
    };
    const first = times[0]!;
    createSeriesMarkers(
      series,
      (pins
        .filter((p) => sec(p.time) >= first)
        .map((p) => ({
          time: snap(sec(p.time)),
          position: p.kind === "macro" ? ("belowBar" as const) : ("aboveBar" as const),
          shape: "square" as const,
          size: 0.6,
          color: p.kind === "macro" ? "#FFD400" : p.bias === "bullish" ? "#00DD94" : p.bias === "bearish" ? "#FF454D" : "rgba(255,255,255,.7)",
        })) as SeriesMarker<Time>[])
        .concat(
          notes
            .filter((n) => sec(n.time) >= first)
            .map((n) => ({ time: snap(sec(n.time)), position: n.position, shape: n.position === "aboveBar" ? ("arrowDown" as const) : ("arrowUp" as const), size: 1, color: n.color, text: n.text })),
        )
        .sort((a, b) => (a.time as number) - (b.time as number)),
    );
    const from = focusFrom ? times.findIndex((t) => t >= sec(focusFrom)) : -1;
    if (from >= 0) chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, from - 6), to: times.length + 2 });
    else chart.timeScale().fitContent();
    return () => chart.remove();
  }, [bars, levels, pins, notes, focusFrom]);

  if (bars.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-black/30 text-[14px] text-white/40" style={{ height }}>
        No candles stored for this pair yet.
      </div>
    );
  }
  return <div ref={ref} className="w-full" style={{ height }} />;
}
