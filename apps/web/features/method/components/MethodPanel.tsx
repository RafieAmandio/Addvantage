"use client";

import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import type { DailyRead, Level } from "@tradevantage/shared";
import { GLOSSARY, VERDICT, explainLevel, explainSignal, levelName, wib, type Explainer } from "../lib/explain";


const Eyebrow = ({ children }: { children: React.ReactNode }) => <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{children}</p>;

/** Daily bias plus hourly levels; clicking any row draws it on the price chart with a plain explanation. */
export function MethodPanel({
  daily,
  levels,
  open,
  onOpen,
}: {
  daily: DailyRead;
  levels: Level[];
  open: Explainer | null;
  onOpen: (e: Explainer | null) => void;
}) {
  const last = daily.signals.filter((s) => s.time === daily.bar?.time);
  const older = daily.signals.filter((s) => s.time !== daily.bar?.time).slice(0, 4);
  const row = "flex w-full items-center gap-3 py-3 text-left hover:bg-raised/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";

  return (
    <Panel title="Anthony Method" sub="Daily bias and hourly levels, checked against the rules. Tap any line to see it drawn on the chart.">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Eyebrow>Daily bias</Eyebrow>
          <p className={cn("font-num text-[32px] font-semibold leading-9", daily.bias === "bullish" ? "text-up" : daily.bias === "bearish" ? "text-down" : "text-white/55")}>
            {daily.bias === "bullish" ? "Buys" : daily.bias === "bearish" ? "Sells" : "No bias"}
          </p>
          <p className="text-[13px] text-white/40">{daily.bar ? `From the ${wib(daily.bar.time, false)} close` : "No closed day yet"}</p>
        </div>
        <div>
          <Eyebrow>ATR used today</Eyebrow>
          <p className={cn("font-num text-[32px] font-semibold leading-9", (daily.usedPct ?? 0) >= 100 ? "text-down" : "text-white")}>{daily.usedPct !== null ? `${daily.usedPct.toFixed(0)}%` : "n/a"}</p>
          <p className="text-[13px] text-white/40">{daily.atr !== null ? `ATR ${fmtPrice(daily.atr)}` : "Not enough candles"}</p>
        </div>
        <div>
          <Eyebrow>Today&apos;s ATR band</Eyebrow>
          <p className="font-num text-[20px] font-semibold leading-9 text-white/90">
            {daily.atrFloor !== null && daily.atrTop !== null ? `${fmtPrice(daily.atrFloor)} to ${fmtPrice(daily.atrTop)}` : "n/a"}
          </p>
          <p className="text-[13px] text-white/40">No buys over the top, no sells under the floor</p>
        </div>
      </div>

      <div className="mt-5">
        <Eyebrow>Daily signals</Eyebrow>
        <div className="divide-y divide-white/[0.07]">
          {last.length === 0 && <p className="py-3 text-[14px] text-white/40">Nothing printed on the last daily candle.</p>}
          {[...last, ...older].map((s, i) => {
            const e = explainSignal(s, daily.atrTop, daily.atrFloor);
            const on = open?.title === e.title;
            return (
              <button key={`${s.time}-${s.name}-${s.dir}-${i}`} type="button" onClick={() => onOpen(on ? null : e)} className={cn(row, i >= last.length && "opacity-60")} aria-pressed={on}>
                <span className={cn("w-16 shrink-0 text-[13px] font-semibold", s.shallow ? "text-white/40" : s.dir === "bullish" ? "text-up" : "text-down")}>{s.dir === "bullish" ? "Bullish" : "Bearish"}</span>
                <span className="min-w-0 flex-1 text-[14px] text-white/90">
                  {s.name}
                  {s.shallow && <span className="text-white/40"> (too shallow)</span>}
                  <span className="block text-[12px] text-white/40">{wib(s.time, false)}{i >= last.length ? ", earlier day" : ""}</span>
                </span>
                <span className="font-num text-[16px] font-semibold text-white/80">{fmtPrice(s.entry)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <Eyebrow>Hourly levels</Eyebrow>
        <div className="divide-y divide-white/[0.07]">
          {levels.length === 0 && <p className="py-3 text-[14px] text-white/40">No hourly levels near price.</p>}
          {levels.map((l) => {
            const e = explainLevel(l);
            const on = open?.title === e.title;
            return (
              <button key={`${l.type}-${l.side}-${l.price}`} type="button" onClick={() => onOpen(on ? null : e)} className={row} aria-pressed={on}>
                <span className={cn("w-24 shrink-0 text-[13px] font-semibold", VERDICT[l.verdict].cls)}>{VERDICT[l.verdict].label}</span>
                <span className="min-w-0 flex-1 text-[14px] text-white/90">
                  <span className={l.side === "buy" ? "text-up" : "text-down"}>{l.side === "buy" ? "Buy" : "Sell"}</span> {levelName(l)}
                  <span className="block truncate text-[12px] text-white/40">
                    {l.reasons[0] ?? `${l.touches.length} touches, naked, ${l.r !== null ? `${l.r.toFixed(2)}R` : "no target"}`}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-num text-[16px] font-semibold text-white/80">{fmtPrice(l.price)}</span>
                  {l.r !== null && <span className="block text-[12px] text-white/40">{l.r.toFixed(2)}R</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="mt-5 rounded-xl bg-raised p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[15px] font-semibold text-white">{open.title}</p>
            <button type="button" onClick={() => onOpen(null)} className="text-[13px] text-white/40 hover:text-white">
              Clear chart
            </button>
          </div>
          <ol className="mt-3 space-y-3">
            {open.steps.map((s, i) => (
              <li key={s.head} className="grid grid-cols-[20px_1fr] gap-2">
                <span className="font-num text-[15px] font-semibold text-brand">{i + 1}</span>
                <span>
                  <span className="block text-[14px] font-semibold text-white">{s.head}</span>
                  <span className="block text-[14px] leading-[21px] text-white/60">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <details className="mt-5 group">
        <summary className="cursor-pointer text-[13px] text-white/55 hover:text-white">What do these words mean?</summary>
        <dl className="mt-2 divide-y divide-white/[0.07]">
          {GLOSSARY.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[140px_1fr]">
              <dt className="text-[13px] font-semibold text-white">{k}</dt>
              <dd className="text-[13px] leading-5 text-white/55">{v}</dd>
            </div>
          ))}
        </dl>
      </details>
    </Panel>
  );
}
