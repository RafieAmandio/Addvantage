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
const UP = "#079C6B";
const DOWN = "#D6303A";

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

  return (
    <figure className="relative mx-auto w-full max-w-[560px] pt-12">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/logo-mark.png" alt="" aria-hidden width={88} height={88} className="lv-bob absolute left-10 top-0 z-0 h-[72px] w-[72px] rotate-[-8deg] md:h-[88px] md:w-[88px]" />
      <div className="relative z-10 -rotate-2 rounded-sm border-2 border-black bg-[#F3F0E7] p-4 text-[#141414] shadow-[8px_10px_0_#FFD400] md:p-6">
        <div className="flex items-baseline justify-between gap-3 border-b-2 border-[#141414] pb-3">
          <p className="font-sans text-xl font-bold tracking-[-0.02em] md:text-2xl">Tap the level that broke.</p>
          <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-[#141414]/60">{r.sym} 1H</p>
        </div>

        <div
          className={cn("relative mt-4 touch-manipulation", answer ? "cursor-default" : "cursor-crosshair")}
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
            up={UP}
            down={DOWN}
            className="block h-[210px] w-full md:h-[260px]"
            label={`${r.sym} hourly candles up to the retest of a broken level`}
          >
            {(s) => {
              const x = s.x(r.thrust);
              return (
                <>
                  <line x1={x} x2={x} y1={H - 10} y2={H} stroke="#141414" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                  {hover !== null && (
                    <line x1={0} x2={W} y1={s.y(hover)} y2={s.y(hover)} stroke="#141414" strokeDasharray="3 4" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  )}
                  {answer && (
                    <>
                      {!answer.ok && <line x1={0} x2={W} y1={s.y(answer.price!)} y2={s.y(answer.price!)} stroke={DOWN} strokeDasharray="3 4" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />}
                      <line x1={0} x2={W} y1={s.y(r.level.price)} y2={s.y(r.level.price)} stroke="#141414" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                    </>
                  )}
                </>
              );
            }}
          </Candles>
          <span className="pointer-events-none absolute -bottom-5 -translate-x-1/2 font-mono text-[10px] font-bold uppercase tracking-[0.1em]" style={{ left: `${(sc.x(r.thrust) / W) * 100}%` }}>
            break
          </span>
          {hover !== null && (
            <span
              className="pointer-events-none absolute right-0 -translate-y-1/2 bg-[#141414] px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-[#F3F0E7]"
              style={{ top: `${(sc.y(hover) / H) * 100}%` }}
            >
              {fmtPrice(hover)}
            </span>
          )}
          {answer && (
            <span
              className="pointer-events-none absolute right-0 -translate-y-full bg-brand px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-[#141414]"
              style={{ top: `${(sc.y(r.level.price) / H) * 100}%` }}
            >
              {fmtPrice(r.level.price)}
            </span>
          )}
        </div>

        <div className="mt-7 flex min-h-[64px] items-start justify-between gap-4 border-t border-[#141414]/25 pt-3" aria-live="polite">
          {answer ? (
            <p className="font-mono text-[13px] leading-[1.5]">
              <span className={cn("mr-2 font-bold", answer.ok ? "text-[#079C6B]" : "text-[#D6303A]")}>{answer.ok ? "Right." : "Not quite."}</span>
              {answer.feedback}
            </p>
          ) : (
            <p className="font-mono text-[13px] leading-[1.5] text-[#141414]/70">Real candles, cut at the retest. Tap the price the break went through.</p>
          )}
          {answer && rounds.length > 1 && (
            <button type="button" onClick={next} className="shrink-0 font-mono text-[13px] font-bold underline decoration-2 underline-offset-4 hover:text-[#141414]/70">
              Try another
            </button>
          )}
        </div>
      </div>
    </figure>
  );
}
