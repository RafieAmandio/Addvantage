"use client";

import { useState } from "react";
import type { Candle } from "@tradevantage/shared";
import type { LevelRound } from "@/features/marketing/lib/landing";
import { gradeLevel, type Answer } from "@/features/method/lib/practice";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { Candles, scaleFor } from "@/features/marketing/components/demos/Candles";
import { cn } from "@/lib/cn";

const W = 560;
const H = 300;
const PAD = 18;

/** The hero's one object: a real chart cut at the retest, and the app grades where you tap. */
export function LevelCard({ rounds }: { rounds: LevelRound[] }) {
  const [n, setN] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const r = rounds[n % rounds.length]!;
  const { s: sc, price: priceOf } = scaleFor(r.bars, { prices: [r.level.price], W, H, pad: PAD });

  const priceAt = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return priceOf(((e.clientY - box.top) / box.height) * H);
  };

  const tap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (answer) return;
    const price = priceAt(e);
    const bars: Candle[] = r.bars.map(([t, open, high, low, close]) => ({ time: new Date(t).toISOString(), open, high, low, close }));
    setAnswer(gradeLevel(r.level, bars, price, r.daily));
    setHover(null);
  };

  const next = () => {
    setAnswer(null);
    setN((i) => i + 1);
  };

  const corner = "absolute h-3 w-3 border-brand";

  return (
    <figure className="relative mx-auto w-full max-w-[580px] border border-white/20 bg-black font-mono text-white">
      <span aria-hidden className={cn(corner, "-left-px -top-px border-l-2 border-t-2")} />
      <span aria-hidden className={cn(corner, "-right-px -top-px border-r-2 border-t-2")} />
      <span aria-hidden className={cn(corner, "-bottom-px -left-px border-b-2 border-l-2")} />
      <span aria-hidden className={cn(corner, "-bottom-px -right-px border-b-2 border-r-2")} />
      <div className="flex items-center justify-between gap-3 border-b border-white/20 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] md:px-5 md:text-xs">
        <span>[ Fig. 01 · <span className="text-brand">Tap the level</span> ]</span>
        <span className="text-white/60">{r.sym} · 1H</span>
      </div>

      <div className="p-4 md:p-5">
        <p className="text-sm font-bold md:text-base">Tap the level that broke.</p>
        <div
          className={cn("relative mt-4 touch-manipulation bg-[radial-gradient(rgba(255,255,255,.09)_1px,transparent_1px)] [background-size:14px_14px]", answer ? "cursor-default" : "cursor-crosshair")}
          onPointerMove={(e) => !answer && e.pointerType === "mouse" && setHover(priceAt(e))}
          onPointerLeave={() => setHover(null)}
          onPointerUp={tap}
        >
          <Candles
            bars={r.bars}
            prices={[r.level.price]}
            W={W}
            H={H}
            pad={PAD}
            className="block h-[210px] w-full md:h-[260px]"
            label={`${r.sym} hourly candles up to the retest of a broken level`}
          >
            {(s) => (
              <>
                <line x1={s.x(r.thrust)} x2={s.x(r.thrust)} y1={H - 10} y2={H} stroke="#FFD400" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                {hover !== null && <line x1={0} x2={W} y1={s.y(hover)} y2={s.y(hover)} stroke="#FFD400" strokeDasharray="3 4" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
                {answer && !answer.ok && (
                  <line x1={0} x2={W} y1={s.y(answer.price!)} y2={s.y(answer.price!)} stroke="#FF454D" strokeDasharray="3 4" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                )}
                {answer && <line x1={0} x2={W} y1={s.y(r.level.price)} y2={s.y(r.level.price)} stroke="#FFD400" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
              </>
            )}
          </Candles>
          <span className="pointer-events-none absolute -bottom-5 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.1em] text-brand" style={{ left: `${(sc.x(r.thrust) / W) * 100}%` }}>
            break
          </span>
          {hover !== null && (
            <span className="pointer-events-none absolute right-0 -translate-y-1/2 border border-brand bg-black px-1.5 py-0.5 text-[11px] tabular-nums text-brand" style={{ top: `${(sc.y(hover) / H) * 100}%` }}>
              {fmtPrice(hover)}
            </span>
          )}
          {answer && (
            <span className="pointer-events-none absolute right-0 -translate-y-full bg-brand px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-black" style={{ top: `${(sc.y(r.level.price) / H) * 100}%` }}>
              {fmtPrice(r.level.price)}
            </span>
          )}
        </div>

        <div className="mt-7 flex min-h-[64px] flex-col items-start justify-between gap-2 border-t sm:flex-row sm:gap-4 border-white/20 pt-3" aria-live="polite">
          {answer ? (
            <p className="text-[13px] leading-[1.5] text-white/85">
              <span className={cn("mr-2 font-bold", answer.ok ? "text-up" : "text-down")}>{answer.ok ? "RIGHT." : "NOT QUITE."}</span>
              {answer.feedback}
            </p>
          ) : (
            <p className="text-[13px] leading-[1.5] text-white/60">Real candles, cut at the retest. Tap the price the break went through.</p>
          )}
          {answer && rounds.length > 1 && (
            <button type="button" onClick={next} className="shrink-0 text-[13px] font-bold uppercase text-brand hover:text-white">
              [ Try another ]
            </button>
          )}
        </div>
      </div>
    </figure>
  );
}
