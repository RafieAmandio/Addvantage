"use client";

import { cn } from "@/lib/cn";
import type { PracticeData } from "@/features/marketing/lib/landing";
import { useStory } from "@/features/marketing/lib/use-story";
import { Candles } from "./Candles";
import { Panel, Pointer } from "./Panel";

const GAPS = [1400, 900, 2300, 900, 1700];
const W = 600;
const H = 300;
const CHART = 220;
const ROW = 56;

/** A practice drill from real history: find the break, then see what the level actually did. */
export function PracticeDemo({ d }: { d: PracticeData }) {
  const [ref, step] = useStory(GAPS, 4400);
  const all = [...d.bars, ...d.after];
  const n = all.length;
  const lo = Math.min(...all.map((b) => b[3]), d.stop, d.target);
  const hi = Math.max(...all.map((b) => b[2]), d.stop, d.target);
  const yPct = (p: number) => ((14 + (1 - (p - lo) / (hi - lo)) * (H - 28)) / H) * 100;
  const t = d.bars[d.thrust]!;
  const candleX = ((d.thrust + 0.5) / n) * 100;
  const candleY = (yPct((t[2] + t[3]) / 2) * CHART) / (CHART + ROW);
  const win = d.kind === "win";

  return (
    <Panel ref={ref} title={`Practice, ${d.sym} 1H`} meta={<span className="tabular-nums text-white/60">Drill</span>}>
      <p className="min-h-[3.2em] px-4 pt-3 font-mono text-[13px] leading-snug text-white">
        {step >= 2 ? (
          <span key="right" className="lv-flash block">
            <b className="mr-1 text-tv-up">Right.</b>
            <span className="text-white/75">{d.feedback}</span>
          </span>
        ) : (
          d.prompt
        )}
      </p>
      <div className="relative mx-3 mb-3" style={{ height: CHART + ROW }}>
        <div className="relative" style={{ height: CHART }}>
          <Candles
            bars={all}
            prices={[d.stop, d.target]}
            W={W}
            H={H}
            label={`${d.sym} hourly drill, level ${d.fmt.price}, outcome ${d.r}`}
            className="absolute inset-0 h-full w-full"
            candleClass={(i) => cn("transition-opacity duration-300", step >= 2 && step < 4 && i !== d.thrust && i < d.bars.length && "opacity-40")}
          >
            {(s) => {
              const x0 = s.x(d.thrust);
              const line = (p: number, c: string) => <path d={`M${x0} ${s.y(p)} H${W}`} stroke={c} strokeWidth={1.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" className="lv-fade" style={{ opacity: step >= 4 ? 1 : 0 }} />;
              const cut = s.x(d.bars.length) - s.w / 2;
              return (
                <>
                  <rect x={x0 - s.w * 0.9} width={s.w * 1.8} y={s.y(t[2]) - 5} height={s.y(t[3]) - s.y(t[2]) + 10} fill="none" stroke="#FFD400" strokeWidth={2} vectorEffect="non-scaling-stroke" className="lv-fade" style={{ opacity: step >= 2 ? 1 : 0 }} />
                  {line(d.price, "#FFD400")}
                  {line(d.stop, "#E06A5E")}
                  {line(d.target, "#4E9F6E")}
                  {/* The future, covered until asked for, then wiped open left to right. */}
                  <rect x={cut} width={W - cut} y={0} height={H} fill="#16171A" className="lv-grow" style={{ transformOrigin: "right", transform: step >= 4 ? "scaleX(0)" : "scaleX(1)" }} />
                  <line x1={cut} x2={cut} y1={0} y2={H} stroke="rgba(255,255,255,.25)" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
                </>
              );
            }}
          </Candles>
          {step >= 5 && (
            <span className={cn("lv-stamp absolute right-3 top-3 rounded-[4px] border-2 bg-black/85 px-3 py-1 font-mono text-xl font-bold", win ? "border-tv-up text-tv-up" : "border-tv-down text-tv-down")}>
              {win ? "Win" : "Loss"} {d.r}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 pt-3" style={{ height: ROW }}>
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/50">{step >= 4 ? (win ? "Target first" : "Stop first, loss capped at 1R") : "Chart cut at the retest"}</span>
          <span className={cn("rounded-[6px] px-3 py-2 font-mono text-[12px] font-bold transition-colors", step >= 4 ? "bg-white/10 text-white/50" : step === 3 ? "bg-brand text-black" : "border border-white/20 text-white/80")}>Reveal what happened</span>
        </div>
        <Pointer x={step >= 3 ? 82 : candleX} y={step >= 3 ? 90 : candleY} show={step >= 1 && step <= 4} tap={step === 2 || step === 4} />
      </div>
    </Panel>
  );
}
