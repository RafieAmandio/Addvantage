"use client";

import { cn } from "@/lib/cn";
import { useStory } from "@/features/marketing/lib/use-story";
import { Panel } from "./Panel";

export type WireItem = { t: string; at: string; tag: null | { impact: "HIGH" | "MED"; moves: [string, "up" | "down"][] } };

// A sample wire. Headlines are illustrative, not reports of real events.
export const WIRE: WireItem[] = [
  { at: "07:02", t: "Central bank chair repeats policy will stay data dependent", tag: null },
  { at: "07:15", t: "US inflation prints above forecast for a second month", tag: { impact: "HIGH", moves: [["USD", "up"], ["XAU", "down"]] } },
  { at: "07:21", t: "Bank raises its year-end gold target, again", tag: null },
  { at: "07:40", t: "Japan's finance ministry confirms it intervened for the yen", tag: { impact: "HIGH", moves: [["JPY", "up"]] } },
  { at: "07:52", t: "Famous investor says this rally feels like the top", tag: null },
  { at: "08:05", t: "UK payrolls miss, unemployment ticks up", tag: { impact: "MED", moves: [["GBP", "down"]] } },
  { at: "08:11", t: "Ten stocks to buy before the year ends", tag: null },
  { at: "08:30", t: "Oil producers agree a surprise output cut", tag: { impact: "HIGH", moves: [["WTI", "up"]] } },
];
const GAPS = WIRE.flatMap(() => [520, 780]);

export function FilterDemo({ onLoop }: { onLoop?: () => void }) {
  const [ref, step] = useStory(GAPS, 3800, onLoop);
  const shown = WIRE.filter((_, i) => step >= 2 * i);
  const judged = (i: number) => step >= 2 * i + 2;
  const kept = WIRE.filter((x, i) => x.tag && judged(i)).length;
  const cut = WIRE.filter((x, i) => !x.tag && judged(i)).length;

  return (
    <Panel ref={ref} title="Wire, sample feed" meta={<span className="tabular-nums text-white/70">{cut} cut / {kept} kept</span>} className="h-full">
      <ol className="flex h-[400px] flex-col justify-end gap-1 overflow-hidden px-3 pb-3 md:h-[520px]" aria-live="off">
        {shown.map((x) => {
          const i = WIRE.indexOf(x);
          const done = judged(i);
          const noise = done && !x.tag;
          return (
            <li key={x.t} className={cn("lv-in grid grid-cols-[3.2rem_1fr] items-start gap-x-2 rounded-[6px] px-2 py-2 font-mono text-[13px] leading-snug transition-colors duration-300", done && x.tag && "bg-brand/[0.07]")}>
              <span className="pt-px text-white/45 tabular-nums">{x.at}</span>
              <span className="min-w-0">
                <span className={cn("transition-[color,text-decoration-color] duration-500", noise ? "text-white/40 line-through decoration-blood-bright decoration-2" : "text-white")}>{x.t}</span>
                {done && (
                  <span className="lv-flash mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]">
                    {x.tag ? (
                      <>
                        <span className={cn("rounded-[3px] px-1.5 py-0.5", x.tag.impact === "HIGH" ? "bg-brand text-black" : "border border-brand text-brand")}>{x.tag.impact} impact</span>
                        {x.tag.moves.map(([c, d]) => (
                          <span key={c} className={d === "up" ? "text-tv-up" : "text-tv-down"}>
                            {c} {d === "up" ? "▲ up" : "▼ down"}
                          </span>
                        ))}
                      </>
                    ) : (
                      <span className="text-tv-down">Noise, cut</span>
                    )}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
