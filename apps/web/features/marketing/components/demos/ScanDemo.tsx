"use client";

import { cn } from "@/lib/cn";
import type { ScanData } from "@/features/marketing/lib/landing";
import { useStory } from "@/features/marketing/lib/use-story";
import { scaleFor } from "./Candles";
import { Sheet } from "./Sheet";

/** The morning scan: answers about the last daily close, graded by the app's own read of it. Plays by itself. */
export function ScanDemo({ d }: { d: ScanData }) {
  // One step per answer, in order, then a score.
  const answers = d.questions.flatMap((q, qi) => q.picks.map((p) => ({ qi, ...p })));
  const gaps = [1300, ...answers.map(() => 1800)];
  const [ref, step] = useStory(gaps, 4000);
  const given = answers.slice(0, Math.max(0, step));
  const firstTry = d.questions.filter((q) => q.picks[0]!.ok).length;
  const W = 420;
  const H = 110;
  const { s } = scaleFor(d.days, { W, H, pad: 8 });
  const last = d.days.length - 1;

  return (
    <Sheet ref={ref} title={`Morning scan, ${d.sym} 1D`} meta={<span className="tabular-nums text-tv-mute">{Math.min(step, answers.length)}/{answers.length}</span>}>
      <div className="relative mx-4 mt-3 h-[110px]">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="img" aria-label={`${d.sym} last ${d.days.length} daily candles`}>
          {d.days.map((b, i) => {
            const top = s.y(Math.max(b[1], b[4]));
            const bot = s.y(Math.min(b[1], b[4]));
            return (
              <g key={b[0]} stroke="#111214" opacity={i === last ? 1 : 0.45}>
                <line x1={s.x(i)} x2={s.x(i)} y1={s.y(b[2])} y2={s.y(b[3])} vectorEffect="non-scaling-stroke" />
                <rect x={s.x(i) - s.w * 0.32} width={s.w * 0.64} y={top} height={Math.max(1, bot - top)} fill={i === last ? "#FFD400" : b[4] >= b[1] ? "#FFFFFF" : "#3A3C40"} vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
        </svg>
        <span className="absolute right-0 top-0 font-mono text-[11px] uppercase tracking-[0.06em]">Last close</span>
      </div>
      <ol className="flex flex-col gap-4 px-4 py-4">
        {d.questions.map((q, qi) => {
          const mine = given.filter((a) => a.qi === qi);
          const now = mine.at(-1);
          return (
            <li key={q.ask} className="flex flex-col gap-1.5">
              <span className="text-[15px] font-medium">
                {qi + 1}. {q.ask}
              </span>
              <span className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px] uppercase tracking-[0.04em]">
                {q.options.map((o) => {
                  const hit = now?.pick === o ? now : undefined;
                  const tried = mine.some((a) => a.pick === o && !a.ok) && !hit;
                  return (
                    <span key={`${o}-${hit ? "hit" : "no"}`} className={cn("border-b py-0.5", hit ? (hit.ok ? "lv-flash border-tv-ink font-semibold" : "lv-shake border-tv-ink line-through") : tried ? "border-transparent text-tv-mute line-through" : "border-transparent text-tv-graphite")}>
                      {o}
                    </span>
                  );
                })}
              </span>
              {now && (
                <span key={now.pick} className="lv-flash text-[13px] leading-snug text-tv-graphite">
                  <b className="font-semibold text-tv-ink">{now.ok ? "Right." : "No."}</b> {now.text}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className={cn("mx-4 mb-4 mt-auto border-t border-tv-stone pt-3 text-[13px] transition-opacity duration-300", step > answers.length ? "opacity-100" : "opacity-0")}>
        Graded: <b className="font-semibold">{firstTry} of {d.questions.length}</b> right first time. Wrong answers come back with the reason.
      </p>
    </Sheet>
  );
}
