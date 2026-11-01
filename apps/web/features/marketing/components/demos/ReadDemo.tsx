"use client";

import { cn } from "@/lib/cn";
import type { ReadData } from "@/features/marketing/lib/landing";
import { useStory } from "@/features/marketing/lib/use-story";
import { Candles } from "./Candles";
import { Panel } from "./Panel";

const GAPS = [900, 1400, 1300, 1000, 1000];
const W = 600;
const H = 320;
const RIGHT = 110;

/** The hourly chart's break-and-retest read, drawn one piece at a time on real candles. */
export function ReadDemo({ d, onLoop }: { d: ReadData; onLoop?: () => void }) {
  const [ref, step] = useStory(GAPS, 4200, onLoop);
  const buy = d.side === "buy";
  const legend = ["Break", buy ? "LHPB" : "LLPB", "Stop", "Target", "R"];

  return (
    <Panel ref={ref} title={`${d.sym} 1H, ${d.bars.length} real candles`} meta={<span className="text-brand">Read</span>} className="h-full">
      <div className="relative mx-3 mt-3 h-[280px] md:h-[420px]">
        <Candles
          bars={d.bars}
          prices={[d.stop, d.target]}
          W={W}
          H={H}
          right={RIGHT}
          label={`${d.sym} hourly candles with the ${legend[1]} at ${d.fmt.price}, stop ${d.fmt.stop}, target ${d.fmt.target}`}
          className="absolute inset-0 h-full w-full"
          candleClass={(i) => cn("transition-opacity duration-500", step === 1 && i !== d.thrust && "opacity-25")}
        >
          {(s) => {
            const yL = s.y(d.price);
            const x0 = W - RIGHT + 8;
            const box = (to: number, fill: string, on: boolean) => (
              <rect x={x0} width={RIGHT - 14} y={Math.min(yL, s.y(to))} height={Math.abs(yL - s.y(to))} fill={fill} className="lv-grow" style={{ transform: on ? "scaleX(1)" : "scaleX(0)", opacity: on ? 1 : 0 }} />
            );
            const t = d.bars[d.thrust]!;
            return (
              <>
                {/* The break candle, ringed */}
                <rect
                  x={s.x(d.thrust) - s.w * 0.9}
                  width={s.w * 1.8}
                  y={s.y(t[2]) - 6}
                  height={s.y(t[3]) - s.y(t[2]) + 12}
                  fill="none"
                  stroke="#FFD400"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  className="lv-fade"
                  style={{ opacity: step >= 1 ? 1 : 0 }}
                />
                {box(d.stop, "rgba(255,69,77,.32)", step >= 3)}
                {box(d.target, "rgba(0,221,148,.26)", step >= 4)}
                <path
                  d={`M${s.x(d.touch)} ${yL} H${W - 6}`}
                  pathLength={1}
                  stroke="#FFD400"
                  strokeWidth={2}
                  strokeDasharray="1"
                  vectorEffect="non-scaling-stroke"
                  className="lv-draw"
                  style={{ strokeDashoffset: step >= 2 ? 0 : 1 }}
                />
                <circle cx={s.x(d.touch)} cy={yL} r={4} fill="#FFD400" className="lv-fade" style={{ opacity: step >= 2 ? 1 : 0 }} />
              </>
            );
          }}
        </Candles>
        <Labels d={d} step={step} />
      </div>
      <ol className="mt-auto grid grid-cols-5 border-t border-white/10 font-mono text-[11px] uppercase tracking-[0.08em]">
        {legend.map((x, i) => (
          <li key={x} className={cn("border-r border-white/10 px-2 py-2.5 text-center transition-colors duration-300 last:border-r-0", step > i ? "bg-brand text-black" : "text-white/45")}>
            <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span> {x}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/** Price tags in HTML so the text never stretches with the chart. */
function Labels({ d, step }: { d: ReadData; step: number }) {
  const lo = Math.min(...d.bars.map((b) => b[3]), d.stop, d.target);
  const hi = Math.max(...d.bars.map((b) => b[2]), d.stop, d.target);
  const pad = 14 / H;
  const top = (p: number) => `${(pad + (1 - (p - lo) / (hi - lo)) * (1 - pad * 2)) * 100}%`;
  const xT = ((d.thrust + 0.5) / d.bars.length) * ((W - RIGHT) / W) * 100;
  const t = d.bars[d.thrust]!;
  const tag = "lv-fade absolute right-1 -translate-y-1/2 rounded-[3px] px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className="lv-fade absolute whitespace-nowrap rounded-[3px] bg-brand px-1.5 py-0.5 font-mono text-[11px] font-bold text-black" style={{ left: `${Math.min(xT, 62)}%`, top: `calc(${top(d.side === "buy" ? t[3] : t[2])} + ${d.side === "buy" ? 14 : -30}px)`, opacity: step >= 1 ? 1 : 0, transform: `translateX(-30%) translateY(${step >= 1 ? 0 : 6}px)` }}>
        Break, {d.fmt.thrust}
      </span>
      <span className={cn(tag, "bg-brand text-black")} style={{ top: top(d.price), opacity: step >= 2 ? 1 : 0 }}>
        {d.side === "buy" ? "LHPB" : "LLPB"} {d.fmt.price}
      </span>
      <span className={cn(tag, "bg-down text-black")} style={{ top: top(d.stop), opacity: step >= 3 ? 1 : 0 }}>
        Stop {d.fmt.stop}
      </span>
      <span className={cn(tag, "bg-up text-black")} style={{ top: top(d.target), opacity: step >= 4 ? 1 : 0 }}>
        Target {d.fmt.target}
      </span>
      {step >= 5 && (
        <span className="lv-stamp absolute left-[6%] top-[8%] rounded-[4px] border-2 border-brand bg-black/80 px-3 py-1.5 font-mono text-lg font-bold text-brand md:text-2xl">
          {d.r}R, {d.verdict === "order" ? "order in" : d.verdict}
        </span>
      )}
    </div>
  );
}
