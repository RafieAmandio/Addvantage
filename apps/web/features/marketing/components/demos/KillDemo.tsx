"use client";

import { cn } from "@/lib/cn";
import type { KillData } from "@/features/marketing/lib/landing";
import { useStory } from "@/features/marketing/lib/use-story";
import { Sheet } from "./Sheet";

const LIMIT = 4;

/** The kill list as a journal page: three losses in a day and the journal will not open a fourth trade. Blocks come from the app's killList. */
export function KillDemo({ d }: { d: KillData }) {
  const gaps = [1300, ...d.losses.slice(1).map(() => 1300), 1700];
  const [ref, step] = useStory(gaps, 4400);
  const losses = d.losses.slice(0, Math.min(step, d.losses.length));
  const lost = Number(losses.at(-1)?.lost ?? 0);
  const blocks = losses.at(-1)?.blocks ?? [];
  const locked = blocks.length > 0;
  const tapped = step > d.losses.length;
  const row = "flex justify-between gap-3 border-b border-tv-stone py-1.5 font-mono text-[12px] tabular-nums";

  return (
    <Sheet ref={ref} title="Journal, kill list" meta={<span className="font-semibold">{locked ? "Locked" : "Open"}</span>}>
      <div className="grid gap-6 p-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <p className="flex justify-between font-mono text-[11px] uppercase tracking-[0.08em] text-tv-mute">
            <span>New trade</span>
            <span>20:00 WIB</span>
          </p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.01em]">
            {d.sym} {d.side === "buy" ? "Buy" : "Sell"}
          </p>
          <p className="text-[14px] text-tv-graphite">Break and retest, {d.risk}% risk</p>
          <div className="relative mt-4">
            <span key={tapped ? "tap" : "still"} aria-hidden className={cn("tv-btn w-full", locked ? "tv-btn-line text-tv-mute line-through" : "tv-btn-ink", tapped && "lv-shake")}>
              Save as open
            </span>
            {locked && (
              <span className="lv-thud absolute -right-1 -top-4 border-2 border-tv-ink bg-tv-white px-2 py-0.5 font-mono text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ rotate: "-6deg" }}>
                Blocked
              </span>
            )}
          </div>
          {blocks.map((b) => (
            <p key={b.rule} className="lv-flash mt-3 text-[13px] leading-snug">
              <b className="font-semibold">{b.rule}.</b> <span className="text-tv-graphite">{b.evidence}</span>
            </p>
          ))}
        </div>

        <div className="flex flex-col">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-tv-mute">Closed today</p>
          <ul className="mt-2 flex min-h-[6.5rem] flex-col border-t border-tv-ink">
            {losses.map((l) => (
              <li key={l.at} className={cn("lv-in", row)}>
                <span className="text-tv-graphite">{l.at}</span>
                <span>-1R, -{d.risk.toFixed(2)}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between font-mono text-[11px] uppercase tracking-[0.06em] text-tv-graphite">
            <span>Lost today</span>
            <span className={cn("tabular-nums", locked && "font-semibold text-tv-ink")}>
              {lost.toFixed(2)}% / {LIMIT}% limit
            </span>
          </p>
          {/* A ruler: the loss so far in ink, the limit as a tick. */}
          <div className="relative mt-2 h-2 border border-tv-ink">
            <div className="h-full bg-tv-ink transition-[width] duration-700 ease-out" style={{ width: `${Math.min(100, (lost / (LIMIT * 1.25)) * 100)}%` }} />
            <span className="absolute -top-1.5 h-4 w-px bg-tv-ink" style={{ left: `${(1 / 1.25) * 100}%` }} aria-hidden />
          </div>
        </div>
      </div>
    </Sheet>
  );
}
