"use client";

import { useEffect, useRef, useState } from "react";
import type { Candle } from "@tradevantage/shared";
import { cn } from "@/lib/cn";
import { journalBars } from "../actions";
import type { Rule } from "../lib/journal";
import s from "./journal.module.css";

export const motion = s;

export const eyebrow = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";
export const label = "text-[13px] font-medium text-white/70";
export const input =
  "h-11 w-full rounded-xl bg-raised px-4 text-[15px] text-white ring-1 ring-white/[0.08] placeholder:text-white/25 outline-none focus-visible:ring-brand";
const btn = "inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:opacity-40";
export const primary = cn(btn, "h-11 bg-brand px-5 text-[14px] text-black hover:bg-brand/90");
export const secondary = cn(btn, "h-11 border border-white/[0.14] px-5 text-[14px] text-white hover:bg-raised");
export const small = cn(btn, "h-8 border border-white/[0.14] px-3 text-[13px] text-white/80 hover:bg-raised hover:text-white");
export const chip = (on: boolean) =>
  cn(btn, "rounded-full border px-2.5 py-1 text-[12px]", on ? "border-brand bg-brand/10 text-brand" : "border-white/[0.12] text-white/60 hover:text-white");

/** Counts changes after the first render, so animations never play on page load. */
export function useChanges(value: unknown) {
  const first = useRef(true);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setN((x) => x + 1);
  }, [value]);
  return n;
}

/** A number that fades in when it changes. */
export function Num({ value, className }: { value: string; className?: string }) {
  const n = useChanges(value);
  return (
    <span key={n} className={cn("font-num font-semibold", n > 0 && s.fade, className)}>
      {value}
    </span>
  );
}

function RuleRow({ r }: { r: Rule }) {
  const n = useChanges(r.met);
  const flash = n > 0 && r.met !== null ? (r.met ? s.flashOk : s.flashBad) : undefined;
  return (
    <li key={n} className={cn("-mx-2 flex gap-2 rounded-lg px-2 py-2 text-[13px] leading-[18px]", flash)}>
      <span className="relative w-4 shrink-0 font-semibold" aria-label={r.met === null ? "no data" : r.met ? "met" : "not met"}>
        <span className={cn("absolute inset-0 text-up transition-opacity duration-200", r.met === true ? "opacity-100" : "opacity-0")}>✓</span>
        <span className={cn("absolute inset-0 text-down transition-opacity duration-200", r.met === false ? "opacity-100" : "opacity-0")}>✕</span>
        <span className={cn("absolute inset-0 text-white/30 transition-opacity duration-200", r.met === null ? "opacity-100" : "opacity-0")}>·</span>
      </span>
      <span className="min-w-0">
        <span className="block text-white">{r.rule}</span>
        <span className="block text-white/45">{r.evidence}</span>
      </span>
    </li>
  );
}

export function Checklist({ rules }: { rules: Rule[] }) {
  return (
    <ul className="divide-y divide-white/[0.07]">
      {rules.map((r) => (
        <RuleRow key={r.rule} r={r} />
      ))}
    </ul>
  );
}

const barCache = new Map<string, Promise<{ daily: Candle[]; hourly: Candle[] }>>();
/** Candles per market, fetched once per page and shared between rows. */
export function loadBars(symbol: string, fromIso?: string) {
  const key = `${symbol}|${fromIso?.slice(0, 10) ?? ""}`;
  if (!barCache.has(key)) barCache.set(key, journalBars(symbol, fromIso).catch(() => ({ daily: [], hourly: [] })));
  return barCache.get(key)!;
}

export function useBars(symbol: string | null, fromIso?: string) {
  const [bars, setBars] = useState<{ symbol: string; daily: Candle[]; hourly: Candle[] } | null>(null);
  useEffect(() => {
    if (!symbol) return;
    let live = true;
    loadBars(symbol, fromIso).then((b) => live && setBars({ symbol, ...b }));
    return () => {
      live = false;
    };
  }, [symbol, fromIso]);
  return bars && bars.symbol === symbol ? bars : null;
}

export const fmtR = (r: number) => `${r >= 0 ? "+" : ""}${r.toFixed(2)}R`;
export const rCls = (r: number) => (r > 0 ? "text-up" : r < 0 ? "text-down" : "text-white/55");
export const wibShort = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) + " WIB";
export const money = (n: number, ccy: string) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })} ${ccy}`;
