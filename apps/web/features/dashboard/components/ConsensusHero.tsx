"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { StepChart, type StepSeries } from "@/components/ui/StepChart";
import { formatVolume } from "@/features/predictions/lib/format";
import type { PredictionCardData } from "@/features/predictions/types";

export interface ConsensusMarket {
  card: PredictionCardData;
  /** History for the top outcomes, oldest first, p in 0..1. */
  series: { label: string; points: { t: number; p: number }[] }[];
}

const COLORS = ["#FFD400", "rgba(255,255,255,.75)"];
const RANGES = [
  { id: "1W", days: 7 },
  { id: "1M", days: 30 },
  { id: "ALL", days: Infinity },
] as const;

/** Card snapshots store probability in percent, history in 0..1. */
const toPct = (p: number) => (p > 1 ? p : p * 100);

function endsLabel(fetchedAt: string, stale: boolean) {
  if (!stale) return "Live";
  const d = new Date(fetchedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `Not updated since ${d}`;
}

/** Kalshi-style hero: one market at a time, inline legend, step chart, range tabs. */
export function ConsensusHero({ markets }: { markets: ConsensusMarket[] }) {
  const [i, setI] = useState(0);
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("1M");
  const m = markets[i];

  const series: StepSeries[] = useMemo(() => {
    if (!m) return [];
    const days = RANGES.find((r) => r.id === range)!.days;
    const latest = Math.max(0, ...m.series.flatMap((s) => s.points.map((p) => p.t)));
    const from = days === Infinity ? 0 : latest - days * 86400;
    return m.series.map((s, k) => {
      const pts = s.points.filter((p) => p.t >= from);
      // Hourly ticks read as noise at this size; ~120 steps matches Kalshi's density.
      const step = Math.max(1, Math.ceil(pts.length / 120));
      return { label: s.label, color: COLORS[k] ?? "#888", points: pts.filter((_, j) => j % step === 0 || j === pts.length - 1) };
    });
  }, [m, range]);

  if (!m) {
    return (
      <div className="flex h-full min-h-[320px] flex-col justify-center rounded-2xl bg-panel p-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">Market consensus</p>
        <p className="mt-2 max-w-sm text-[15px] text-white/55">No tracked prediction markets right now. Add them in Admin to show crowd odds here.</p>
      </div>
    );
  }

  const { tracked, outcomes, volume, fetchedAt, stale } = m.card;
  const go = (d: number) => setI((v) => (v + d + markets.length) % markets.length);

  return (
    <section aria-label="Market consensus" className="flex min-w-0 flex-col gap-4 rounded-2xl bg-panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
            {tracked.category}
            <span className="px-1.5 text-white/30">/</span>
            Crowd odds
          </p>
          <h2 className="mt-1 text-balance font-num text-[30px] font-semibold leading-[32px] tracking-[-0.01em] text-white">
            {tracked.eventTitle}
          </h2>
        </div>
        {markets.length > 1 && (
          <div className="flex shrink-0 gap-1.5">
            {[-1, 1].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => go(d)}
                aria-label={d < 0 ? "Previous market" : "Next market"}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.14] text-white/70 transition-colors hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d={d < 0 ? "M8.5 3L4.5 7l4 4" : "M5.5 3l4 4-4 4"} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-white/55">
        {outcomes.slice(0, 2).map((o, k) => (
          <span key={o.label} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[k] }} aria-hidden />
            {o.label}
            <b className="font-semibold text-white">{toPct(o.probability).toFixed(toPct(o.probability) < 1 ? 1 : 0)}%</b>
            {o.weekChange !== null && o.weekChange !== 0 && (
              <span className={cn("text-[12px] font-medium", o.weekChange > 0 ? "text-up" : "text-down")}>
                {o.weekChange > 0 ? "▲" : "▼"} {Math.abs(toPct(o.weekChange)).toFixed(1)}
              </span>
            )}
          </span>
        ))}
      </div>

      <StepChart series={series} height={230} />

      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <div className="flex items-center gap-3">
          <span className="text-white/90">{formatVolume(volume)} vol</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em]", stale ? "bg-down/15 text-down" : "bg-up/15 text-up")}>
            {endsLabel(fetchedAt, stale)}
          </span>
          <span className="text-white/30">Polymarket</span>
        </div>
        <div className="flex items-center gap-5">
          {markets.length > 1 && (
            <div className="flex gap-1.5" aria-hidden>
              {markets.map((_, k) => (
                <span key={k} className={cn("h-1.5 rounded-full transition-all", k === i ? "w-5 bg-white/80" : "w-1.5 bg-white/25")} />
              ))}
            </div>
          )}
          <div className="flex gap-4" role="group" aria-label="Range">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={range === r.id}
                onClick={() => setRange(r.id)}
                className={cn("font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand", range === r.id ? "text-white" : "text-white/30 hover:text-white/60")}
              >
                {r.id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
