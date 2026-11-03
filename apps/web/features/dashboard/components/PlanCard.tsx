"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FOREX_PAIRS } from "@tradevantage/shared";
import { cn } from "@/lib/cn";
import { apiGet } from "@/lib/api/client";
import { toChartBars } from "@/features/chart/lib/bars";
import { AnimatedFigure, AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useEvery } from "@/features/dashboard/hooks/useLive";
import type { Bar } from "@/features/chart/components/PriceChart";
import type { Bar as DbBar } from "@/features/chart/queries/bars";
import type { TradingPlan, TradingSetup } from "@/features/plan/types";

function age(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (Number.isNaN(days)) return null;
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
}

/** Every number in a desk string: "158.10 to 158.35" gives both ends of the zone. */
const nums = (s?: string) => (s?.replace(/,/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
const decimals = (s?: string) => s?.replace(/,/g, "").match(/\d+\.(\d+)/)?.[1]?.length ?? 0;
/** "XAUUSD" is "XAU/USD" in the bars query; indices pass through. */
const barSymbol = (inst: string) => FOREX_PAIRS.find((p) => p.symbol.replace("/", "") === inst.toUpperCase())?.symbol ?? inst.toUpperCase();

/** The last few days of hourly candles (Yahoo in demo), refreshed every minute while the tab is visible. */
function useSetupBars(instrument: string) {
  const [bars, setBars] = useState<Bar[]>([]);
  const load = useCallback(() => {
    const now = Date.now();
    const qs = new URLSearchParams({
      symbol: barSymbol(instrument),
      interval: "1h",
      from: new Date(now - 5 * 86_400_000).toISOString(),
      to: new Date(now).toISOString(),
    });
    apiGet<{ bars: DbBar[] }>(`/bars?${qs}`)
      .then((d) => setBars(toChartBars(d.bars ?? []).slice(-56)))
      .catch(() => {});
  }, [instrument]);
  useEffect(load, [load]);
  useEvery(60_000, load);
  return bars;
}

const W = 320;
const H = 116;

/** Hourly candles with the setup drawn on: entry zone, stop (dashed), first target, and where price is now. */
function SetupChart({ setup, bars }: { setup: TradingSetup; bars: Bar[] }) {
  const entry = nums(setup.entry).slice(0, 2);
  const stop = nums(setup.stop)[0];
  const target = nums(setup.targets[0])[0];
  const last = bars.at(-1)?.close;
  // The marker starts on the entry and travels to the live price once the candles land.
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (last === undefined) return;
    const id = requestAnimationFrame(() => setShown(last));
    return () => cancelAnimationFrame(id);
  }, [last]);

  if (bars.length < 2 || !entry.length) {
    return <div className="h-[116px] rounded-lg bg-black/[0.06]" aria-hidden />;
  }
  const levels = [...entry, stop, target].filter((v): v is number => Number.isFinite(v));
  const lo0 = Math.min(...bars.map((b) => b.low), ...levels);
  const hi0 = Math.max(...bars.map((b) => b.high), ...levels);
  const pad = (hi0 - lo0) * 0.08 || 1;
  const lo = lo0 - pad;
  const hi = hi0 + pad;
  const y = (v: number) => ((hi - v) / (hi - lo)) * H;
  const pct = (v: number) => `${((hi - v) / (hi - lo)) * 100}%`;
  const slot = (W - 84) / bars.length;
  const now = shown ?? entry[0]!;
  const line = (v: number, dash?: string) => (
    <line x1={0} x2={W} y1={y(v)} y2={y(v)} stroke="#000" strokeOpacity={0.7} strokeDasharray={dash} vectorEffect="non-scaling-stroke" />
  );

  return (
    <div className="relative h-[116px]">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-full w-full overflow-visible" role="img" aria-label={`${setup.instrument} hourly candles with entry, stop and target`}>
        {entry.length === 2 && <rect x={0} width={W} y={y(Math.max(...entry))} height={Math.abs(y(entry[0]!) - y(entry[1]!))} fill="#000" fillOpacity={0.1} />}
        {entry.map((v) => <g key={v}>{line(v, "1 3")}</g>)}
        {Number.isFinite(stop) && line(stop!, "4 3")}
        {Number.isFinite(target) && line(target!)}
        <g className="plan-candles">
          {bars.map((b, i) => {
            const x = 18 + i * slot + slot / 2;
            const up = b.close >= b.open;
            return (
              <g key={b.time} style={{ "--i": i } as React.CSSProperties}>
                <line x1={x} x2={x} y1={y(b.high)} y2={y(b.low)} stroke="#000" vectorEffect="non-scaling-stroke" />
                <rect
                  x={x - slot * 0.32}
                  width={slot * 0.64}
                  y={y(Math.max(b.open, b.close))}
                  height={Math.max(0.8, Math.abs(y(b.open) - y(b.close)))}
                  fill={up ? "#FFD400" : "#000"}
                  stroke="#000"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </g>
      </svg>
      {/* Level tags on the left edge, the live price pill on the right. */}
      {[
        ["TP", target],
        ["SL", stop],
        ["E", entry[0]],
      ].map(([k, v]) =>
        Number.isFinite(v as number) ? (
          <span key={k as string} className="absolute left-0 -translate-y-1/2 rounded-sm bg-brand pr-1 text-[10px] font-semibold leading-3 text-black/70" style={{ top: pct(v as number) }}>
            {k}
          </span>
        ) : null,
      )}
      <div className="plan-now absolute right-0 flex -translate-y-1/2 items-center" style={{ top: pct(now) }}>
        <span className="h-px w-5 border-t border-dashed border-black" aria-hidden />
        <span className="rounded-full bg-black px-1.5 py-px text-[11px] font-semibold tabular-nums text-brand">
          {last !== undefined ? <AnimatedNumber value={last} from={entry[0]} format={(v) => v.toFixed(decimals(setup.entry))} duration={1100} /> : null}
        </span>
      </div>
    </div>
  );
}

/** Where price sits between the stop (left) and the first target (right), with the entry marked. */
function Progress({ setup, last }: { setup: TradingSetup; last: number | undefined }) {
  const entry = nums(setup.entry)[0];
  const stop = nums(setup.stop)[0];
  const target = nums(setup.targets[0])[0];
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (entry === undefined || stop === undefined || target === undefined || stop === target) return null;
  const p = (v: number) => Math.min(1, Math.max(0, (v - stop) / (target - stop))) * 100;
  const now = ready && last !== undefined ? last : entry;
  const dp = decimals(setup.entry);
  const fmt = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  const a = Math.min(p(entry), p(now));
  const b = Math.max(p(entry), p(now));
  const winning = p(now) >= p(entry);
  return (
    <div className="mt-3">
      <div className="relative h-2 rounded-full bg-black/[0.12]">
        <div className={cn("plan-progress absolute inset-y-0 rounded-full", winning ? "bg-black" : "bg-black/35")} style={{ left: `${a}%`, width: `${b - a}%` }} />
        <span className="absolute -top-1 h-4 w-px bg-black/50" style={{ left: `${p(entry)}%` }} aria-hidden />
        <span className="plan-progress-dot absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-black" style={{ left: `${p(now)}%` }} aria-hidden />
      </div>
      {last !== undefined && (
        <div className="mt-1.5 flex justify-between text-[12px] text-black/60">
          <span>
            Stop <b className="font-semibold text-black tabular-nums">{fmt(Math.abs(last - stop))}</b> away
          </span>
          <span>
            Target <b className="font-semibold text-black tabular-nums">{fmt(Math.abs(target - last))}</b> away
          </span>
        </div>
      )}
    </div>
  );
}

function Setup({ top }: { top: TradingSetup }) {
  const bars = useSetupBars(top.instrument);
  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="font-num text-[40px] font-semibold leading-[40px] tracking-[-0.01em]">{top.instrument}</span>
        <span className="rounded-full bg-black px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-brand">{top.direction}</span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-[13px]">
        {[
          ["Entry", top.entry],
          ["Stop", top.stop],
          ["Target", top.targets[0] ?? "None"],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-black/55">{k}</dt>
            <dd className="truncate font-num text-[20px] font-semibold leading-6">
              <AnimatedFigure text={v} fromRatio={0.98} />
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4">
        <SetupChart setup={top} bars={bars} />
        <Progress setup={top} last={bars.at(-1)?.close} />
      </div>
    </>
  );
}

/** Celsis-style yellow hero card for the active trading plan: the lead setup on its live chart, then the rest. */
export function PlanCard({ plan, paid }: { plan: TradingPlan | null; paid: boolean }) {
  const top = plan?.setups[0];
  const published = plan ? age(plan.date) : null;
  const more = plan?.setups.slice(1) ?? [];

  return (
    <section aria-label="Active trading plan" className="flex min-w-0 flex-1 flex-col rounded-2xl bg-brand p-5 text-black shadow-[inset_0_1px_0_rgb(255_255_255/0.45)] sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-black/60">
          Active plan{plan ? <span className="px-1.5 text-black/30">/</span> : null}
          {plan?.horizon}
        </p>
        {published && <span className="text-[12px] text-black/55">{published}</span>}
      </div>

      {!plan ? (
        <div className="flex flex-1 flex-col justify-center py-6">
          <p className="font-num text-[30px] font-semibold leading-8">No plan published</p>
          <p className="mt-1 text-[14px] text-black/65">The desk hasn&apos;t posted a plan yet.</p>
        </div>
      ) : !paid || !top ? (
        <div className="flex flex-1 flex-col justify-center py-6">
          <p className="font-num text-[30px] font-semibold leading-8">{plan.setups.length} setups live</p>
          <p className="mt-1 text-[14px] text-black/65">Entries, stops and the thesis are for VIP+.</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col py-4">
          <Setup top={top} />
          {more.length > 0 && (
            <div className="mt-4 border-t border-black/15 pt-3">
              <p className="text-[12px] font-semibold text-black/60">+{more.length} more {more.length === 1 ? "setup" : "setups"}</p>
              <ul className="mt-1">
                {more.slice(0, 3).map((s, i) => (
                  <li key={s.id} className="enter-row" style={{ "--i": i + 4 } as React.CSSProperties}>
                    <Link
                      href={`/app/plan/${plan.id}`}
                      className="lift -mx-2 grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-3 rounded-md px-2 py-1.5 text-[13px] hover:bg-black/[0.07] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/40"
                    >
                      <span className="truncate font-semibold">
                        {s.instrument}
                        <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-black/70">
                          {s.direction === "long" ? "▲ Long" : "▼ Short"}
                        </span>
                      </span>
                      <span className="text-black/55">
                        E <b className="font-semibold tabular-nums text-black">{nums(s.entry)[0]?.toLocaleString("en-US", { minimumFractionDigits: decimals(s.entry), maximumFractionDigits: decimals(s.entry) }) ?? s.entry}</b>
                      </span>
                      <span className="text-black/55">
                        SL <b className="font-semibold tabular-nums text-black">{s.stop}</b>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto flex gap-2">
        <Link
          href={plan ? `/app/plan/${plan.id}` : "/app/plan"}
          className="lift flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-black text-[14px] font-semibold text-white transition-colors hover:bg-black-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
        >
          {plan && !paid ? "Unlock plan" : "Open plan"}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M3 9l6-6M4.5 3H9v4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link
          href="/app/plan/archive"
          className="lift flex h-11 items-center rounded-full border border-black/20 px-4 text-[14px] font-semibold transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
        >
          Archive
        </Link>
      </div>
    </section>
  );
}
