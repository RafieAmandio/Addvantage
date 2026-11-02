"use client";

import { cn } from "@/lib/cn";
import type { ScanData } from "@/features/marketing/lib/landing";
import { useStory } from "@/features/marketing/lib/use-story";
import { Candles } from "./Candles";
import { Panel } from "./Panel";

/** The morning scan: answers about the last daily close, graded by the app's own read of it. */
export function ScanDemo({ d }: { d: ScanData }) {
  // One step per answer, in order, then a score.
  const answers = d.questions.flatMap((q, qi) => q.picks.map((p) => ({ qi, ...p })));
  const gaps = [1300, ...answers.map(() => 1800)];
  const [ref, step] = useStory(gaps, 4000);
  const given = answers.slice(0, Math.max(0, step));
  const firstTry = d.questions.filter((q) => q.picks[0]!.ok).length;

  return (
    <Panel ref={ref} title={`Morning scan, ${d.sym} 1D`} meta={<span className="tabular-nums text-white/60">{Math.min(step, answers.length)}/{answers.length}</span>}>
      <div className="relative mx-3 mt-3 h-[110px]">
        <Candles bars={d.days} W={400} H={110} pad={8} right={0} label={`${d.sym} last ${d.days.length} daily candles`} className="absolute inset-0 h-full w-full" candleClass={(i) => (i === d.days.length - 1 ? undefined : "opacity-45")} />
        <span className="absolute right-0 top-0 rounded-[3px] bg-brand px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-black">Last close</span>
      </div>
      <ol className="flex flex-col gap-3 p-3">
        {d.questions.map((q, qi) => {
          const mine = given.filter((a) => a.qi === qi);
          const last = mine.at(-1);
          return (
            <li key={q.ask} className="flex flex-col gap-1.5">
              <span className="font-mono text-[12px] text-white/70">
                {qi + 1}. {q.ask}
              </span>
              <span className="flex flex-wrap gap-1.5">
                {q.options.map((o) => {
                  const hit = last?.pick === o ? last : undefined;
                  const tried = mine.some((a) => a.pick === o && !a.ok) && !hit;
                  return (
                    <span
                      key={`${o}-${hit ? "hit" : "no"}`}
                      className={cn(
                        "rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors duration-200",
                        hit ? (hit.ok ? "lv-flash border-tv-up bg-tv-up text-black" : "lv-shake border-tv-down bg-tv-down text-white") : tried ? "border-tv-down/50 text-white/40 line-through" : "border-white/20 text-white/75",
                      )}
                    >
                      {o}
                    </span>
                  );
                })}
              </span>
              {last && (
                <span key={last.pick} className={cn("lv-flash font-mono text-[11px] leading-snug", last.ok ? "text-tv-up" : "text-tv-down")}>
                  {last.text}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className={cn("mx-3 mb-3 mt-auto rounded-[6px] border border-white/10 px-3 py-2 font-mono text-[12px] transition-opacity duration-300", step > answers.length ? "opacity-100" : "opacity-0")}>
        Graded: <b className="text-brand">{firstTry} of {d.questions.length}</b> right first time. Wrong answers come back with the reason.
      </p>
    </Panel>
  );
}
