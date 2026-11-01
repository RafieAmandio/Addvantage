"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { useAppState, isPaid } from "@/lib/state";
import { Panel, PanelLink } from "@/components/ui/Panel";
import { CalendarPanel } from "@/features/dashboard/components/CalendarPanel";
import { NewsPanel } from "@/features/dashboard/components/NewsPanel";
import { fmtPrice, dayChange } from "@/features/dashboard/components/PriceStrip";
import { InstrumentChart, type ChartLevel, type ChartPin } from "@/features/instrument/components/InstrumentChart";
import { AtrGauge, NewsPulse, RsiMeter, SessionRing, newsPulse } from "@/features/instrument/components/DotMatrix";
import { PairRatesPanel } from "@/features/macro/components/MacroPanels";
import type { Ccy, MacroData } from "@/features/macro/types";
import { StructureStrip } from "@/features/bulletin/components/StructureStrip";
import { useSeenNews } from "@/features/news/hooks/useSeenNews";
import type { AtrPair } from "@/features/atr/types";
import type { Bulletin } from "@/features/bulletin/types";
import type { CalendarEvent } from "@/features/calendar/types";
import type { Bar } from "@/features/chart/components/PriceChart";
import type { NewsListItem } from "@/features/news/queries/news";
import type { TradingPlan, TradingSetup } from "@/features/plan/types";

export interface RsiDetail {
  symbol: string;
  label: string;
  group: string;
  price: number | null;
  intervals: Record<string, { rsi: number; zone: string; ts: string }>;
}

type Setup = TradingSetup & { planDate: string; horizon: TradingPlan["horizon"] };

const num = (s: string | undefined) => {
  const n = Number.parseFloat((s ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/40">{children}</p>
);

export default function InstrumentClient({
  symbol,
  label,
  group,
  rsi,
  atr,
  hourly,
  daily,
  news,
  setups,
  bulletin,
  calendar,
  macro,
  legs,
}: {
  symbol: string;
  label: string;
  group: string;
  rsi: RsiDetail | null;
  atr: (AtrPair & { label: string }) | null;
  hourly: Bar[];
  daily: Bar[];
  news: NewsListItem[];
  setups: Setup[];
  bulletin: Bulletin | null;
  calendar: CalendarEvent[];
  macro: MacroData;
  legs: Ccy[];
}) {
  const { tier } = useAppState();
  const paid = isPaid(tier);
  const { ids: seenIds, hydrated } = useSeenNews();
  const [tf, setTf] = useState<"1H" | "1D">("1H");

  const last = hourly.at(-1)?.close ?? atr?.price ?? rsi?.price ?? null;
  const change = atr ? dayChange(atr) : null;
  const prev = daily.at(-2);
  const top = setups[0];

  const levels: ChartLevel[] = useMemo(() => {
    const out: ChartLevel[] = [];
    if (atr) out.push({ price: atr.upperLevel, label: "ATR top", kind: "atr" }, { price: atr.lowerLevel, label: "ATR floor", kind: "atr" });
    if (prev) out.push({ price: prev.high, label: "PDH", kind: "prev" }, { price: prev.low, label: "PDL", kind: "prev" });
    if (paid && top) {
      const e = num(top.entry);
      const s = num(top.stop);
      const t = num(top.targets[0]);
      if (e !== null) out.push({ price: e, label: "Entry", kind: "plan" });
      if (s !== null) out.push({ price: s, label: "Stop", kind: "stop" });
      if (t !== null) out.push({ price: t, label: "T1", kind: "target" });
    }
    return out;
  }, [atr, prev, paid, top]);

  const bars = tf === "1H" ? hourly : daily;
  const pins: ChartPin[] = useMemo(() => {
    const end = bars.at(-1)?.time ?? "";
    return [
      ...news.map((n) => ({ time: n.publishedAt ?? n.fetchedAt, kind: "news" as const, bias: n.bias as ChartPin["bias"] })),
      ...calendar.map((e) => ({ time: e.ts, kind: "macro" as const })),
    ].filter((p) => p.time <= end);
  }, [bars, news, calendar]);

  const days = useMemo(() => newsPulse(news), [news]);

  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      {/* Header: identity and price left, today's range use right. */}
      <section className="grid gap-4 rounded-2xl bg-panel p-5 sm:p-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <Link href="/app/heatmap" className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/40 hover:text-white/70">
            {group} <span className="text-white/20">/</span> {label}
          </Link>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-num text-[52px] font-semibold leading-[52px] tracking-[-0.01em] text-white">{symbol}</h1>
            {last !== null && <span className="font-num text-[34px] font-semibold leading-9 text-white/90">{fmtPrice(last)}</span>}
            {change !== null && (
              <span className={cn("text-[15px] font-semibold", change >= 0 ? "text-up" : "text-down")}>
                {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% today
              </span>
            )}
          </div>
          {bulletin?.whatToWatch && paid && <p className="mt-3 max-w-2xl text-[15px] leading-[22px] text-white/70">{bulletin.whatToWatch}</p>}
        </div>

        {atr ? (
          <div className="min-w-0 self-end">
            <div className="flex items-baseline justify-between">
              <Eyebrow>Daily range used</Eyebrow>
              <span className={cn("font-num text-[28px] font-semibold leading-7", atr.exhaustionPct >= 100 ? "text-down" : "text-brand")}>
                {Math.round(atr.exhaustionPct)}%
              </span>
            </div>
            <div className="mt-2">
              <AtrGauge usedPct={atr.exhaustionPct} />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[11px] text-white/30">
              <span>0</span>
              <span className="text-white/55">100% ATR {fmtPrice(atr.atr)}</span>
              <span>150</span>
            </div>
          </div>
        ) : (
          <p className="self-end text-[13px] text-white/40">No ATR read for this instrument.</p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          <Panel
            title="Price"
            sub={
              <span className="flex flex-wrap gap-x-3">
                <span><i className="mr-1 inline-block h-px w-3 border-t border-dashed border-brand align-middle" />ATR band</span>
                <span><i className="mr-1 inline-block h-px w-3 border-t border-dotted border-white/60 align-middle" />Prev day</span>
                {paid && top && <span><i className="mr-1 inline-block h-px w-3 bg-brand align-middle" />Plan</span>}
                <span><i className="mr-1 inline-block h-1.5 w-1.5 bg-white/70 align-middle" />News</span>
              </span>
            }
            action={
              <div className="flex gap-4 text-[13px]" role="group" aria-label="Timeframe">
                {(["1H", "1D"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={tf === t}
                    onClick={() => setTf(t)}
                    className={cn("font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand", tf === t ? "text-white" : "text-white/30 hover:text-white/60")}
                  >
                    {t}
                  </button>
                ))}
              </div>
            }
          >
            <InstrumentChart bars={bars} levels={levels} pins={pins} />
            <Link href={`/app/lab/${symbol}`} className="mt-3 inline-flex h-9 items-center rounded-full border border-white/[0.14] px-4 text-[13px] font-medium text-white hover:bg-raised">
              Open in Chart Lab
            </Link>
          </Panel>

          <Panel title="Scenarios" sub="Desk setups on this pair from published plans" action={<PanelLink href="/app/plan">Plans</PanelLink>}>
            {setups.length === 0 ? (
              <p className="py-4 text-[14px] text-white/40">No published setup on {symbol} right now.</p>
            ) : (
              <ul className="-my-1 divide-y divide-white/[0.07]">
                {setups.slice(0, 4).map((s) => (
                  <li key={s.id} className="grid gap-3 py-3 sm:grid-cols-[120px_1fr]">
                    <div>
                      <span className={cn("text-[13px] font-semibold uppercase tracking-[0.06em]", s.direction === "long" ? "text-up" : "text-down")}>
                        {s.direction === "long" ? "▲ Long" : "▼ Short"}
                      </span>
                      <p className="text-[12px] text-white/40">
                        {s.horizon} · {s.planDate}
                      </p>
                    </div>
                    {paid ? (
                      <div className="min-w-0">
                        <dl className="grid grid-cols-3 gap-3">
                          {[
                            ["Entry", s.entry],
                            ["Stop", s.stop],
                            ["Target", s.targets.join(" / ") || "—"],
                          ].map(([k, v]) => (
                            <div key={k} className="min-w-0">
                              <dt className="text-[12px] text-white/40">{k}</dt>
                              <dd className="truncate font-num text-[22px] font-semibold leading-6 text-white">{v}</dd>
                            </div>
                          ))}
                        </dl>
                        {s.invalidation && <p className="mt-2 text-[13px] text-white/55">Invalid if {s.invalidation}</p>}
                      </div>
                    ) : (
                      <p className="self-center text-[14px] text-white/55">
                        Levels and thesis are for VIP+. <Link href="/app/subscription" className="text-brand hover:underline">Upgrade</Link>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <NewsPanel news={news} seen={hydrated ? new Set(seenIds) : new Set()} title={`${symbol} news`} limit={8}>
            <div className="mb-4">
              <NewsPulse days={days} />
              <div className="mt-1.5 flex justify-between font-mono text-[11px] text-white/30">
                <span>90d ago</span>
                <span className="hidden sm:inline">coverage per day, coloured by bias</span>
                <span>today</span>
              </div>
            </div>
          </NewsPanel>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Panel title="Desk view" sub={bulletin ? `Structure by timeframe · ${bulletin.status}` : "Structure by timeframe"}>
            {!paid ? (
              <p className="text-[14px] text-white/55">
                The desk&apos;s structure read is for VIP+. <Link href="/app/subscription" className="text-brand hover:underline">Upgrade</Link>
              </p>
            ) : !bulletin ? (
              <p className="text-[14px] text-white/40">The desk hasn&apos;t posted a read on {symbol}.</p>
            ) : (
              <>
                <StructureStrip levels={bulletin.levels} />
                {(bulletin.entry || bulletin.exit) && (
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-3">
                    {[
                      ["Entry", bulletin.entry],
                      ["Exit", bulletin.exit],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[12px] text-white/40">{k}</dt>
                        <dd className="text-[14px] text-white">{v ?? "—"}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </>
            )}
          </Panel>

          <Panel title="RSI 14" sub="Below 30 oversold, above 70 overbought" action={<PanelLink href="/app/heatmap">Heatmap</PanelLink>}>
            <ul className="space-y-3">
              {(["1h", "4h", "1d"] as const).map((k) => {
                const v = rsi?.intervals[k]?.rsi ?? null;
                return (
                  <li key={k} className="grid grid-cols-[32px_1fr_52px] items-center gap-3">
                    <span className="font-mono text-[11px] uppercase text-white/55">{k}</span>
                    <RsiMeter rsi={v} />
                    <span className={cn("text-right font-num text-[22px] font-semibold leading-6", v === null ? "text-white/30" : v <= 30 ? "text-up" : v >= 70 ? "text-down" : "text-white")}>
                      {v === null ? "—" : v.toFixed(1)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <PairRatesPanel data={macro} legs={legs} />

          <Panel title="Sessions" sub="Which desks are trading now">
            <SessionRing />
          </Panel>

          <CalendarPanel events={calendar} sub="Medium and high impact events for this pair, WIB" />

          <Link
            href={`/app/consult?symbol=${encodeURIComponent(symbol)}`}
            className="flex items-center justify-between rounded-2xl bg-brand px-5 py-4 text-black transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>
              <span className="block text-[15px] font-semibold">Ask the desk about {symbol}</span>
              <span className="block text-[13px] text-black/60">One-to-one consultation{paid ? "" : " · VIP+"}</span>
            </span>
            <span aria-hidden className="text-[20px]">→</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
