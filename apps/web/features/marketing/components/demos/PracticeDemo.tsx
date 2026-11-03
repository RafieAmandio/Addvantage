"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Bar, PracticeData } from "@/features/marketing/lib/landing";
import { scaleFor } from "./Candles";
import { Sheet } from "./Sheet";

const W = 640;
const H = 300;

/** Ink candles on white stock: up hollow, down filled, as a chart prints. */
function Printed({ bars, x, y, w, dim }: { bars: Bar[]; x: (i: number) => number; y: (p: number) => number; w: number; dim?: (i: number) => boolean }) {
  return (
    <g stroke="#111214" vectorEffect="non-scaling-stroke">
      {bars.map((b, i) => {
        const top = y(Math.max(b[1], b[4]));
        const bot = y(Math.min(b[1], b[4]));
        return (
          <g key={b[0]} opacity={dim?.(i) ? 0.3 : 1} className="transition-opacity duration-200">
            <line x1={x(i)} x2={x(i)} y1={y(b[2])} y2={y(b[3])} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <rect x={x(i) - w * 0.32} width={w * 0.64} y={top} height={Math.max(1, bot - top)} fill={b[4] >= b[1] ? "#FFFFFF" : "#3A3C40"} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
    </g>
  );
}

/**
 * A practice drill from real history, for real: tap the candle that broke the level (or move
 * with the arrow keys and press Enter). The app grades the tap with its own words. Then reveal
 * what the next candles did, stop or target first.
 */
export function PracticeDemo({ d }: { d: PracticeData }) {
  const all = [...d.bars, ...d.after];
  const n = d.bars.length;
  const { s } = scaleFor(all, { prices: [d.stop, d.target], W, H, pad: 16 });
  const [cursor, setCursor] = useState(Math.floor(n / 2));
  const [tap, setTap] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  // On touch the candles are a few px wide: the first tap aims, a second tap on the same candle picks.
  const [aimed, setAimed] = useState(false);
  const right = tap === d.thrust;
  const win = d.kind === "win";
  const say =
    tap === null
      ? d.prompt
      : right
        ? d.feedback
        : tap - d.thrust === -1
          ? d.wrong.early1
          : tap - d.thrust === 1
            ? d.wrong.late1
            : tap < d.thrust
              ? d.wrong.early
              : d.wrong.late;

  const choose = (i: number) => {
    if (shown) return;
    setCursor(i);
    setTap(i);
  };
  const at = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(n - 1, Math.floor((((e.clientX - r.left) / r.width) * W) / s.w)));
  };
  const cut = s.x(n) - s.w / 2;
  const t = d.bars[d.thrust]!;
  const line = (p: number, label: string, signal?: boolean) => (
    <g>
      {signal ? (
        <rect x={s.x(d.thrust)} y={s.y(p) - 2} width={W - s.x(d.thrust)} height={4} fill="#FFD400" stroke="#111214" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
      ) : (
        <path d={`M${s.x(d.thrust)} ${s.y(p)}H${W}`} stroke="#111214" strokeWidth={1} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
      )}
      <title>{label}</title>
    </g>
  );
  const tag = (p: number, text: string) => (
    <span className="absolute right-2 -translate-y-[130%] bg-tv-white px-1 font-mono text-[11px] tabular-nums" style={{ top: `${(s.y(p) / H) * 100}%` }}>
      {text}
    </span>
  );

  return (
    <Sheet title={`Practice, ${d.sym} 1H`} meta={<span className="hidden tabular-nums text-tv-mute sm:inline">{shown ? (win ? "Target first" : "Stop first, loss capped at 1R") : "Chart cut at the retest"}</span>}>
      <p className="min-h-[4.4em] px-4 pt-3 text-[15px] leading-snug" aria-live="polite">
        <span className={cn(tap !== null && !right && "text-tv-graphite", right && "font-medium")}>{say}</span>
      </p>
      <div className="relative mx-3 mt-1 aspect-[640/300]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="tv-drill absolute inset-0 h-full w-full"
          data-aimed={aimed || undefined}
          role="slider"
          tabIndex={0}
          aria-label={`${d.sym} hourly chart, ${n} candles. ${d.prompt} Left and right arrows move, Enter taps.`}
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={cursor + 1}
          aria-valuetext={`Candle ${cursor + 1} of ${n}`}
          onPointerMove={(e) => e.pointerType === "mouse" && !shown && setCursor(at(e))}
          onPointerUp={(e) => {
            if (e.pointerType === "mouse" || shown) return;
            const i = at(e);
            if (aimed && Math.abs(i - cursor) <= 1) {
              choose(cursor);
              setAimed(false);
            } else {
              setCursor(i);
              setAimed(true);
            }
          }}
          onClick={(e) => {
            // Mouse and keyboard clicks; touch is handled on pointer up above.
            if ((e.nativeEvent as PointerEvent).pointerType && (e.nativeEvent as PointerEvent).pointerType !== "mouse") return;
            choose(at(e));
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              setCursor((c) => Math.max(0, Math.min(n - 1, c + (e.key === "ArrowRight" ? 1 : -1))));
            } else if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              choose(cursor);
            }
          }}
        >
          <Printed bars={all} x={s.x} y={s.y} w={s.w} dim={(i) => right && !shown && i !== d.thrust && i < n} />
          {!shown && <rect x={s.x(cursor) - s.w / 2} width={s.w} y={0} height={H} fill="#111214" opacity={0.06} className="tv-drill-cursor" />}
          {tap !== null && !right && <path d={`M${s.x(tap) - 6} ${s.y(d.bars[tap]![2]) - 14}l12 12m0 -12l-12 12`} stroke="#111214" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />}
          {right && <rect x={s.x(d.thrust) - s.w * 0.9} width={s.w * 1.8} y={s.y(t[2]) - 6} height={s.y(t[3]) - s.y(t[2]) + 12} fill="none" stroke="#111214" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />}
          {(right || shown) && (
            <>
              {line(d.stop, `Stop ${d.fmt.stop}`)}
              {line(d.target, `Target ${d.fmt.target}`)}
              {line(d.price, `Level ${d.fmt.price}`, true)}
            </>
          )}
          {/* The future, under a sheet of blank stock until asked for. */}
          <rect x={cut} width={W - cut} y={0} height={H} fill="#FFFFFF" className="lv-grow" style={{ transformOrigin: "right", transform: shown ? "scaleX(0)" : "scaleX(1)" }} />
          <line x1={cut} x2={cut} y1={0} y2={H} stroke="#111214" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        </svg>
        {(right || shown) && (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {tag(d.price, `Level ${d.fmt.price}`)}
            {tag(d.stop, `Stop ${d.fmt.stop}`)}
            {tag(d.target, `Target ${d.fmt.target}`)}
          </div>
        )}
        {shown && (
          <span className="lv-thud absolute left-3 top-2 border-2 border-tv-ink bg-tv-white px-3 py-1 font-mono text-xl font-semibold" style={{ rotate: "-6deg" }}>
            {win ? "Win" : "Loss"} {d.r}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-tv-mute">{shown ? "Losses included" : aimed ? `Candle ${cursor + 1}, tap again to pick` : `Candle ${cursor + 1} of ${n}`}</span>
        {shown ? (
          <button type="button" className="tv-btn tv-btn-line tv-btn-sm" onClick={() => (setShown(false), setTap(null))}>
            Again
          </button>
        ) : (
          <button type="button" className={cn("tv-btn tv-btn-sm", right ? "tv-btn-ink" : "tv-btn-line")} onClick={() => setShown(true)}>
            Reveal what happened
          </button>
        )}
      </div>
    </Sheet>
  );
}
