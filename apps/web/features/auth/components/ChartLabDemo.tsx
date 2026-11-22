"use client";

import { useEffect, useState } from "react";
import "./chartlab.css";

/**
 * A live-looking slice of chart.tradevantage.gg for the auth plate: XAU/USD H1 candles build in,
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

  const up = live.c >= live.o;
  const chg = ((live.c - PREV_DAY) / PREV_DAY) * 100;
  const lx = x(N);
  const swept = live.l < SUPPORT;

  return (
    <div className="cl-rise relative w-full max-w-[600px]" role="img" aria-label="TradeVantage Chart Lab: XAU/USD sweeps support and the setup turns order ready">
      <div className="overflow-hidden rounded-[14px] border border-white/10 bg-[#0E0F11]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-3.5 py-2 font-mono text-[10.5px] tracking-[0.06em] text-tv-mutedesk">
          <span className="flex items-center gap-2">
            <span className="cl-dot h-1.5 w-1.5 rounded-full bg-[#4C8DFF]" />
            chart.tradevantage.gg
          </span>
          <span>H1</span>
        </div>
        <div className="flex items-end justify-between px-3.5 pb-1 pt-3">
          <div>
            <p className="flex items-center gap-2 text-[13px] font-semibold text-tv-paper">
              XAU/USD <span className="font-mono text-[10px] font-normal tracking-[0.08em] text-tv-mutedesk">TRADEVANTAGE</span>
            </p>
            <p className="mt-0.5 flex items-baseline gap-2 tabular-nums">
              <span className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-tv-paper">{fmt(live.c)}</span>
              <span className={`text-[12px] ${chg >= 0 ? "text-[#4C8DFF]" : "text-tv-down"}`}>
                {chg >= 0 ? "+" : ""}
                {chg.toFixed(2)}%
              </span>
            </p>
          </div>
          <p className="hidden text-[11px] text-tv-mutedesk sm:block">
            D1 <span className="text-tv-paper">none</span> · ATR used <span className="text-tv-paper">57%</span>
          </p>
        </div>
        <svg viewBox={`0 0 ${W + 64} ${H}`} className="block w-full" aria-hidden>
          {[3980, 3960, 3940, 3920, 3900].map((p) => (
            <g key={p}>
              <line x1={0} x2={W} y1={y(p)} y2={y(p)} stroke="rgba(255,255,255,0.04)" />
              <text x={W + 8} y={y(p) + 3.5} className="cl-axis">
                {fmt(p)}
              </text>
            </g>
          ))}
          <g className="cl-level" style={{ animationDelay: "2.2s" }}>
            <line x1={0} x2={W} y1={y(RESIST)} y2={y(RESIST)} stroke="rgba(244,243,239,0.45)" strokeDasharray="4 4" />
            <text x={W - 6} y={y(RESIST) - 5} textAnchor="end" className="cl-axis">
              Resistance {fmt(RESIST)}
            </text>
          </g>
          <g className="cl-level" style={{ animationDelay: "2.5s" }}>
            <line x1={0} x2={W} y1={y(SUPPORT)} y2={y(SUPPORT)} stroke={ready ? "#FFD400" : "rgba(244,243,239,0.45)"} strokeDasharray="4 4" style={{ transition: "stroke 400ms" }} />
            <text x={W - 34} y={y(SUPPORT) + 13} textAnchor="end" className="cl-axis">
              Support {fmt(SUPPORT)}
            </text>
          </g>
          <path d={EMA_D} pathLength={1} className="cl-ema" fill="none" stroke="#E8833A" strokeWidth={1.3} />
          {BARS.map((b, i) => (
            <Candle key={i} b={b} i={i} />
          ))}
          <g>
            <line x1={lx} x2={lx} y1={y(live.h)} y2={y(live.l)} stroke={up ? "#4C8DFF" : "#F4F3EF"} strokeWidth={1} />
            <rect x={lx - 3.2} width={6.4} y={y(Math.max(live.o, live.c))} height={Math.max(1, Math.abs(y(live.o) - y(live.c)))} fill={up ? "#4C8DFF" : "#F4F3EF"} />
          </g>
          {swept && ready && (
            <g className="cl-pop">
              <path d={`M${lx} ${y(live.l) + 6} l-4 7 h8 z`} fill="#FFD400" />
              <text x={lx} y={y(live.l) + 24} textAnchor="middle" className="cl-tag-ink" fill="#FFD400">
                SFP
              </text>
            </g>
          )}
          <line x1={0} x2={W} y1={y(live.c)} y2={y(live.c)} stroke="rgba(255,212,0,0.35)" strokeDasharray="1 3" />
          <rect x={W + 2} y={y(live.c) - 8} width={60} height={16} rx={2} fill="#FFD400" />
          <text x={W + 32} y={y(live.c) + 3.6} textAnchor="middle" className="cl-tag">
            {fmt(live.c)}
          </text>
        </svg>
      </div>

      <div className="cl-card absolute -bottom-12 -left-3 hidden w-[258px] rounded-[12px] border border-white/10 bg-[#16171A]/95 p-3.5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)] backdrop-blur md:block lg:-left-8">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.1em] text-tv-mutedesk">CHART LAB</span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-300 ${ready ? "bg-tv-signal text-tv-ink" : "bg-white/10 text-tv-paper"}`}
          >
            {ready ? "Order ready" : "Needs confirmation"}
          </span>
        </div>
        <p key={String(ready)} className="cl-swap mt-3 text-[16px] font-semibold tracking-[-0.01em] text-tv-paper">
          {ready ? "Buy limit 3,921.40" : `Wait for an SFP at ${fmt(SUPPORT)}`}
        </p>
        <dl className="mt-2.5 grid grid-cols-3 gap-2 text-[11px] tabular-nums">
          {[
            ["Stop", ready ? "3,909.88" : "-"],
            ["Target", fmt(RESIST)],
            ["R", ready ? "4.15R" : "-"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-tv-mutedesk">{k}</dt>
              <dd className="mt-0.5 text-tv-paper">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function Candle({ b, i }: { b: Bar; i: number }) {
  const up = b.c >= b.o;
  const col = up ? "#4C8DFF" : "#F4F3EF";
  const cx = x(i);
  return (
    <g className="cl-candle" style={{ ["--i" as string]: i }}>
      <line x1={cx} x2={cx} y1={y(b.h)} y2={y(b.l)} stroke={col} strokeWidth={1} />
      <rect x={cx - 3.2} width={6.4} y={y(Math.max(b.o, b.c))} height={Math.max(1, Math.abs(y(b.o) - y(b.c)))} fill={col} />
    </g>
  );
}
