"use client";

import { useEffect, useRef } from "react";
import { CandlestickSeries, ColorType, createChart, type UTCTimestamp } from "lightweight-charts";
import type { Candle, Level } from "@tradevantage/shared";
import { BoxPrimitive, type Box } from "./BoxPrimitive";

const sec = (iso: string) => Math.floor(Date.parse(iso) / 1000) as UTCTimestamp;

/** Board thumbnail: last hourly candles with the main zone and its risk/reward box. No axes, no interaction. */
export function MiniChart({ candles, level, extra = [], height = 132 }: { candles: Candle[]; level: Level | null; /** More boxes, by candle index. */ extra?: Box[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || candles.length === 0) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "transparent", attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      timeScale: { visible: false, rightOffset: 14, fixLeftEdge: true },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#00DD94",
      downColor: "#FF454D",
      borderVisible: false,
      wickUpColor: "#00DD94",
      wickDownColor: "#FF454D",
      priceLineVisible: false,
      lastValueVisible: false,
      // Keep the zone, stop and target in frame even when price has run away from them.
      autoscaleInfoProvider: (base: () => { priceRange: { minValue: number; maxValue: number } } | null) => {
        const r = base();
        const px = level ? [level.price, level.stop, level.target].filter((x): x is number => x !== null) : [];
        if (!r || px.length === 0) return r;
        return { ...r, priceRange: { minValue: Math.min(r.priceRange.minValue, ...px), maxValue: Math.max(r.priceRange.maxValue, ...px) } };
      },
    });
    const times = candles.map((c) => sec(c.time));
    series.setData(candles.map((c, i) => ({ time: times[i]!, open: c.open, high: c.high, low: c.low, close: c.close })));
    const boxes: Box[] = [];
    if (level) {
      const last = candles.length - 1;
      const brand = level.verdict === "order";
      const a = `rgba(${brand ? "255,212,0" : "255,255,255"},${0.06 + (level.score / 100) * 0.24})`;
      const pad = Math.abs((level.stop ?? level.price) - level.price) * 0.15;
      boxes.push({ i0: 0, i1: last + 13, top: level.price + pad, bottom: level.price - pad, fill: a, stroke: level.status === "at-level" && level.type === "inverse" ? "rgba(255,212,0,.9)" : undefined });
      if (level.stop !== null) boxes.push({ i0: last + 2, i1: last + 12, top: Math.max(level.price, level.stop), bottom: Math.min(level.price, level.stop), fill: "rgba(255,69,77,.25)" });
      if (level.target !== null) boxes.push({ i0: last + 2, i1: last + 12, top: Math.max(level.price, level.target), bottom: Math.min(level.price, level.target), fill: "rgba(0,221,148,.22)" });
    }
    const prim = new BoxPrimitive([]);
    series.attachPrimitive(prim);
    prim.set([...boxes, ...extra], times);
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [candles, level, extra]);

  if (candles.length === 0) return <div className="rounded-lg bg-black/20" style={{ height }} />;
  return <div ref={ref} className="pointer-events-none w-full" style={{ height }} />;
}
