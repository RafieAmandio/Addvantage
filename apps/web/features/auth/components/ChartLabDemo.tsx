"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "@/features/marketing/components/demos/Sheet";
import "./chartlab.css";

/**
 * A live-looking slice of chart.tradevantage.gg, printed the way the landing prints charts (white
 * stock, ink candles, crop marks, one yellow for the signal): XAU/USD H1 candles build in,
 * the EMA draws, the levels land, then the live candle sweeps under support and closes back
 * (an SFP) and Chart Lab flips from "Needs confirmation" to "Order ready". Demo data, seeded so
 * every load tells the same story. Reduced motion shows the end state.
 */

const SUPPORT = 3919.72;
const RESIST = 3969.2;
const LO = 3901;
const HI = 3984;
const W = 540; // plot width, the price axis sits right of it
const H = 270;
const N = 46; // historic candles; the live one is N
const STEP = W / (N + 2);

type Bar = { o: number; h: number; l: number; c: number };

const r2 = (n: number) => Math.round(n * 100) / 100;
const y = (p: number) => 12 + ((HI - p) / (HI - LO)) * (H - 24);
const x = (i: number) => STEP * (i + 0.5);
const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const BARS: Bar[] = (() => {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  // Waypoints: tag resistance, sell off into support, rally, drift lower again.
  const path = [[0, 3946.3], [8, 3964.8], [22, 3925.6], [32, 3960.4], [45, 3931.9]] as const;
  const at = (i: number) => {
    for (let k = 1; k < path.length; k++) {
      const [i0, p0] = path[k - 1]!;
      const [i1, p1] = path[k]!;
      if (i <= i1) return p0 + ((p1 - p0) * (i - i0)) / (i1 - i0);
    }
    return path[path.length - 1]![1];
  };
  const out: Bar[] = [];
  let prev = 3944.18;
  for (let i = 0; i < N; i++) {
    const c = at(i) + (rnd() - 0.5) * 9;
    const o = prev;
    let h = Math.max(o, c) + rnd() * 4.2;
    let l = Math.min(o, c) - rnd() * 4.2;
    h = i === 8 ? RESIST : Math.min(h, RESIST - 0.6);
    l = i === 22 ? SUPPORT : Math.max(l, SUPPORT + 0.9);
    out.push({ o: r2(o), h: r2(Math.max(h, o, c)), l: r2(Math.min(l, o, c)), c: r2(c) });
    prev = c;
  }
  return out;
})();

const EMA = (() => {
  const k = 2 / 22;
  let e = BARS[0]!.c;
  return BARS.map((b) => (e = b.c * k + e * (1 - k)));
})();
const EMA_D = EMA.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

// The live candle's closes, one per tick: down through support, then back above it.
const SCRIPT = [3927.84, 3923.15, 3917.06, 3912.38, 3916.9, 3924.57, 3931.46];
const OPEN = BARS[N - 1]!.c;
const PREV_DAY = 3926.03;

function finalLive(): Bar {
  return { o: OPEN, h: Math.max(OPEN, ...SCRIPT), l: Math.min(OPEN, ...SCRIPT), c: SCRIPT[SCRIPT.length - 1]! };
}

export function ChartLabDemo() {
  const [live, setLive] = useState<Bar>({ o: OPEN, h: OPEN, l: OPEN, c: OPEN });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLive(finalLive());
      setReady(true);
      return;
    }
    const timers: number[] = [];
    let idle: number | undefined;
    const push = (c: number) => setLive((b) => ({ o: b.o, h: Math.max(b.h, c), l: Math.min(b.l, c), c }));
    SCRIPT.forEach((c, i) => timers.push(window.setTimeout(() => push(c), 3600 + i * 750)));
    timers.push(
      window.setTimeout(() => {
        setReady(true);
        // ponytail: random walk for the idle tick, bounded so the story stays readable.
        idle = window.setInterval(() => {
          setLive((b) => {
            const c = r2(Math.min(3938.4, Math.max(3926.2, b.c + (Math.random() - 0.48) * 1.9)));
            return { o: b.o, h: Math.max(b.h, c), l: b.l, c };
          });
        }, 1100);
      }, 3600 + SCRIPT.length * 750),
    );
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(idle);
    };
  }, []);

  const chg = ((live.c - PREV_DAY) / PREV_DAY) * 100;
  const lx = x(N);
  const swept = live.l < SUPPORT;

  return (
    <div className="cl-rise relative w-full max-w-[600px] pb-10" role="img" aria-label="TradeVantage Chart Lab: XAU/USD sweeps support and the setup turns order ready">
      <Sheet title="chart.tradevantage.gg / XAU/USD 1H" meta={<span className="flex items-center gap-1.5 text-tv-mute"><span className="cl-dot h-1.5 w-1.5 rounded-full bg-tv-ink" />Live</span>}>
        <div className="flex items-end justify-between px-4 pb-1 pt-2">
          <p className="flex items-baseline gap-2 tabular-nums">
            <span className="text-[26px] font-semibold leading-none tracking-[-0.02em]">{fmt(live.c)}</span>
            <span className={cn("font-mono text-[12px]", chg >= 0 ? "text-tv-ink" : "text-tv-downpaper")}>
              {chg >= 0 ? "+" : ""}
              {chg.toFixed(2)}%
            </span>
          </p>
          <p className="hidden font-mono text-[11px] uppercase tracking-[0.08em] text-tv-mute sm:block">D1 none / ATR used 57%</p>
        </div>
        <svg viewBox={`0 0 ${W + 64} ${H}`} className="block w-full" aria-hidden>
          {[3980, 3960, 3940, 3920, 3900].map((p) => (
            <g key={p}>
              <line x1={0} x2={W} y1={y(p)} y2={y(p)} stroke="#111214" strokeOpacity={0.06} />
              <text x={W + 8} y={y(p) + 3.5} className="cl-axis">
                {fmt(p)}
              </text>
            </g>
          ))}
          <g className="cl-level" style={{ animationDelay: "2.2s" }}>
            <line x1={0} x2={W} y1={y(RESIST)} y2={y(RESIST)} stroke="#111214" strokeDasharray="4 4" />
            <text x={6} y={y(RESIST) - 5} className="cl-label">
              RESISTANCE {fmt(RESIST)}
            </text>
          </g>
          <g className="cl-level" style={{ animationDelay: "2.5s" }}>
            {ready && <rect x={0} y={y(SUPPORT) - 1.5} width={W} height={3} fill="#FFD400" className="cl-pop" />}
            <line x1={0} x2={W} y1={y(SUPPORT)} y2={y(SUPPORT)} stroke="#111214" strokeDasharray="4 4" />
            <text x={6} y={y(SUPPORT) + 13} className="cl-label">
              SUPPORT {fmt(SUPPORT)}
            </text>
          </g>
          <path d={EMA_D} pathLength={1} className="cl-ema" fill="none" stroke="#111214" strokeOpacity={0.35} strokeWidth={1.2} />
          {BARS.map((b, i) => (
            <Candle key={i} b={b} i={i} />
          ))}
          <Body b={live} cx={lx} fill={ready ? "#FFD400" : undefined} />
          {swept && ready && (
            <g className="cl-pop">
              <path d={`M${lx} ${y(live.l) + 3} V${y(live.l) + 22} H${lx - 46}`} fill="none" stroke="#111214" />
              <text x={lx - 50} y={y(live.l) + 25.5} textAnchor="end" className="cl-label">
                SFP {fmt(live.l)}
              </text>
            </g>
          )}
          <line x1={0} x2={W} y1={y(live.c)} y2={y(live.c)} stroke="#111214" strokeOpacity={0.4} strokeDasharray="1 3" />
          <rect x={W + 2} y={y(live.c) - 8} width={60} height={16} fill="#111214" />
          <text x={W + 32} y={y(live.c) + 3.6} textAnchor="middle" className="cl-tag">
            {fmt(live.c)}
          </text>
        </svg>
      </Sheet>

      <Sheet title="Chart Lab" className="cl-card absolute -bottom-2 -left-3 hidden w-[264px] md:flex lg:-left-10" meta={
        <span className={cn("rounded-[3px] px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] transition-colors duration-300", ready ? "bg-tv-ink text-tv-paper" : "border border-tv-ink text-tv-ink")}>
          {ready ? "Order" : "Watch"}
        </span>
      }>
        <div className="px-4 pb-3.5 pt-1.5">
          <p key={String(ready)} className="cl-swap text-[16px] font-semibold tracking-[-0.01em]">
            {ready ? "Buy limit 3,921.40" : `Wait for an SFP at ${fmt(SUPPORT)}`}
          </p>
          <dl className="mt-2.5 grid grid-cols-3 gap-2 border-t border-tv-stone pt-2.5 font-mono text-[11px] tabular-nums">
            {[
              ["Stop", ready ? "3,909.88" : "-"],
              ["Target", fmt(RESIST)],
              ["R", ready ? "4.15R" : "-"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="uppercase tracking-[0.08em] text-tv-mute">{k}</dt>
                <dd className="mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Sheet>
    </div>
  );
}

/** Ink candles as a chart prints: up hollow, down filled. */
function Body({ b, cx, fill }: { b: Bar; cx: number; fill?: string }) {
  const top = y(Math.max(b.o, b.c));
  return (
    <g stroke="#111214">
      <line x1={cx} x2={cx} y1={y(b.h)} y2={y(b.l)} strokeWidth={1} />
      <rect x={cx - 3.2} width={6.4} y={top} height={Math.max(1, y(Math.min(b.o, b.c)) - top)} fill={fill ?? (b.c >= b.o ? "#FFFFFF" : "#3A3C40")} strokeWidth={1} />
    </g>
  );
}

function Candle({ b, i }: { b: Bar; i: number }) {
  return (
    <g className="cl-candle" style={{ ["--i" as string]: i }}>
      <Body b={b} cx={x(i)} />
    </g>
  );
}
