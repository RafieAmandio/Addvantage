"use client";

import { cn } from "@/lib/cn";
import type { KillData } from "@/features/marketing/lib/landing";
import { useStory } from "@/features/marketing/lib/use-story";
import { Panel, Pointer } from "./Panel";

const LIMIT = 4;

/** The kill list: three losses in a day and the journal will not open a fourth trade. Blocks come from the app's killList. */
export function KillDemo({ d }: { d: KillData }) {
  const gaps = [1300, ...d.losses.slice(1).map(() => 1300), 1700];
  const [ref, step] = useStory(gaps, 4400);
  const losses = d.losses.slice(0, Math.min(step, d.losses.length));
  const lost = Number(losses.at(-1)?.lost ?? 0);
  const blocks = losses.at(-1)?.blocks ?? [];
  const locked = blocks.length > 0;
  const tapped = step > d.losses.length;

  return (
    <Panel ref={ref} title="Journal, kill list" meta={<span className={cn("tabular-nums", locked ? "text-blood-bright" : "text-up")}>{locked ? "Locked" : "Open"}</span>}>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="rounded-[8px] border border-white/10 bg-black/40 p-3 font-mono text-[12px]">
            <p className="flex justify-between text-white/50">
              <span>New trade</span>
              <span>20:00 WIB</span>
            </p>
            <p className="mt-2 text-lg font-bold">
              {d.sym} <span className={d.side === "buy" ? "text-up" : "text-down"}>{d.side.toUpperCase()}</span>
            </p>
            <p className="text-white/60">Break and retest, {d.risk}% risk</p>
          </div>
          <div className="relative">
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              key={tapped ? "tap" : "still"}
              className={cn("w-full rounded-[8px] px-4 py-3 font-mono text-sm font-bold transition-colors duration-300", locked ? "bg-white/10 text-white/40 line-through" : "bg-brand text-black", tapped && "lv-shake")}
            >
              Save as open
            </button>
            {locked && <span className="lv-stamp absolute -right-1 -top-3 rounded-[3px] border-2 border-blood-bright bg-black px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-blood-bright">Blocked</span>}
            <Pointer x={40} y={40} show={tapped} tap={tapped} />
          </div>
          {blocks.map((b) => (
            <p key={b.rule} className="lv-flash rounded-[6px] bg-blood/30 px-3 py-2 font-mono text-[12px] leading-snug">
              <b className="text-blood-text">{b.rule}.</b> <span className="text-white/85">{b.evidence}</span>
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/50">Closed today</p>
          <ul className="flex min-h-[7.5rem] flex-col gap-1.5">
            {losses.map((l) => (
              <li key={l.at} className="lv-in flex justify-between rounded-[6px] border border-white/10 px-3 py-1.5 font-mono text-[12px]">
                <span className="text-white/60">{l.at}</span>
                <span className="text-down">-1R, -{d.risk.toFixed(2)}%</span>
              </li>
            ))}
          </ul>
          <div>
            <p className="flex justify-between font-mono text-[11px] text-white/60">
              <span>Lost today</span>
              <span className={cn("tabular-nums", locked && "text-blood-bright")}>
                {lost.toFixed(2)}% / {LIMIT}% limit
              </span>
            </p>
            <div className="relative mt-1.5 h-2 rounded-full bg-white/10">
              <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", locked ? "bg-blood-bright" : "bg-brand")} style={{ width: `${Math.min(100, (lost / (LIMIT * 1.25)) * 100)}%` }} />
              <span className="absolute -top-1 h-4 w-px bg-white" style={{ left: `${(1 / 1.25) * 100}%` }} aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
