"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { pipSize, type BoardRow, type Candle } from "@tradevantage/shared";
import { loadMarket } from "../actions";
import { sameSymbol, slug } from "../lib/board";
import { DEFAULT_LAYERS, type Layer } from "../lib/overlays";
import { MethodChart } from "./MethodChart";
import { SymbolPicker } from "./SymbolPicker";

type Bars = { hourly: Candle[]; daily: Candle[] };
const LAST = "lab:last-symbol";

/** Chart Lab: one full-size chart, a symbol picker that holds the board, markets swapped in place. */
export function LabWorkspace({ rows, initial, explicit }: { rows: BoardRow[]; initial: { symbol: string } & Bars; /** Symbol came from the URL, so the last-opened one does not override it. */ explicit: boolean }) {
  const [symbol, setSymbol] = useState(initial.symbol);
  const [bars, setBars] = useState<Bars>(initial);
  const [loading, setLoading] = useState(false);
  const cache = useRef(new Map<string, Bars>([[initial.symbol, initial]]));
  // Preferences that outlive a market switch; the chart itself remounts per market.
  const [layers, setLayers] = useState<Set<Layer>>(() => new Set(DEFAULT_LAYERS));
  const [mode, setMode] = useState<"study" | "practice">("study");
  const [panel, setPanel] = useState(true);

  const open = async (s: string) => {
    if (sameSymbol(s, symbol) && !loading) return;
    const hit = cache.current.get(s);
    let next = hit;
    if (!next) {
      setLoading(true);
      next = (await loadMarket(s).catch(() => null)) ?? { hourly: [], daily: [] };
      cache.current.set(s, next);
      setLoading(false);
    }
    setSymbol(s);
    setBars(next);
  };

  useEffect(() => {
    if (explicit) return;
    let last: string | null = null;
    try {
      last = localStorage.getItem(LAST);
    } catch {}
    if (last && !sameSymbol(last, symbol) && rows.some((r) => sameSymbol(r.symbol, last!))) void open(rows.find((r) => sameSymbol(r.symbol, last!))!.symbol);
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LAST, symbol);
    } catch {}
    // Next keeps its router in sync with history.replaceState, so the URL is shareable without a server round trip.
    const path = `/app/lab/${slug(symbol)}`;
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
  }, [symbol]);

  // Fill the viewport under the app's top bar, and follow window resizes.
  const root = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const fit = () => root.current && setHeight(Math.max(460, window.innerHeight - root.current.getBoundingClientRect().top - window.scrollY));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div ref={root} style={{ height: height ?? "calc(100dvh - 120px)" }} className="border-t border-white/[0.07]">
      <MethodChart
        key={symbol}
        hourly={bars.hourly}
        daily={bars.daily}
        pip={pipSize(symbol)}
        layers={layers}
        onLayers={setLayers}
        mode={mode}
        onMode={setMode}
        panel={panel}
        onPanel={setPanel}
        loading={loading}
        picker={<SymbolPicker rows={rows} symbol={symbol} price={bars.hourly.at(-1)?.close ?? null} loading={loading} onPick={open} />}
      />
    </div>
  );
}
