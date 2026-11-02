"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { PlanData, ReadData } from "@/features/marketing/lib/landing";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";
import { FilterDemo } from "./demos/FilterDemo";
import { PlanDemo } from "./demos/PlanDemo";
import { ReadDemo } from "./demos/ReadDemo";

const STEPS = [
  {
    secs: 14.2,
    title: "Filter",
    line: "Most news is noise. We cut it.",
    body: "Every headline gets read for one thing: does it move price. Noise is struck out. What is left is tagged with its impact and which way it pushes.",
  },
  {
    secs: 9.8,
    title: "Read",
    line: "The level, drawn for you. Then by you.",
    body: "The hourly chart finds the break, the last high or low before it, the stop and the target, and says what R is on the table. Same rules every time.",
  },
  {
    secs: 10.2,
    title: "Execute",
    line: "A journal that says no.",
    body: "Type a plan and the method checks it. Risk over the cap, a stop on the wrong side, a limit past the day's range: the save button refuses until it's fixed.",
  },
];

/** Three steps, one open at a time, each with a demo that plays itself. Advances on its own until someone picks a step. */
export function MethodSection({ read, plan }: { read: ReadData; plan: PlanData }) {
  const [open, setOpen] = useState(0);
  const [picked, setPicked] = useState(false);
  const next = () => !picked && setOpen((o) => (o + 1) % STEPS.length);

  return (
    <section id="method" className="relative z-10 bg-tv-paper px-2 pt-20 md:px-4 md:pt-32">
      {/* The one dark band on the page: the desk, where the real app screens run. */}
      <div data-reveal="band" className="tv-on-desk rounded-[16px] bg-tv-desk py-16 text-tv-paper md:py-28">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-4 sm:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 md:px-10">
        <div className="flex flex-col">
          <p data-reveal className="tv-eyebrow text-tv-mutedesk">The lab, on the desk</p>
          <h2 data-reveal className="mt-5 text-[clamp(2.4rem,5.2vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
            <Scramble text="Filter. Read." />
            <br />
            <Scramble text="Execute." delay={250} />
          </h2>
          <p data-reveal style={{ ["--i" as string]: 1 }} className="mt-5 max-w-[40ch] text-[17px] leading-relaxed text-tv-mutedesk">
            Signals tell you what to do. This shows you how to see it, then stops you when you don&apos;t.
          </p>

          <ol className="mt-10 border-t border-tv-line">
            {STEPS.map((s, i) => {
              const on = open === i;
              return (
                <li key={s.title} data-reveal style={{ ["--i" as string]: i + 2 }} className="border-b border-tv-line">
                  <button
                    type="button"
                    aria-expanded={on}
                    aria-controls={`method-${i}`}
                    onClick={() => {
                      setOpen(i);
                      setPicked(true);
                    }}
                    className="tv-step group grid w-full grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-2 py-5 text-left"
                  >
                    <span className={cn("font-mono text-sm tabular-nums transition-colors", on ? "text-tv-signal" : "text-tv-mutedesk")}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={cn("text-2xl font-semibold tracking-[-0.02em] transition-colors duration-200 md:text-3xl", on ? "text-tv-paper" : "text-tv-mutedesk [@media(hover:hover)]:group-hover:text-tv-paper")}>{s.title}</span>
                    <span aria-hidden className={cn("font-mono text-lg transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]", on ? "rotate-45 text-tv-paper" : "text-tv-mutedesk")}>
                      +
                    </span>
                    <span className="col-start-2 col-end-4 mt-1 text-[15px] text-tv-mutedesk">{s.line}</span>
                  </button>
                  {/* Height snaps (no layout animation); the body fades up 8px like the FAQ. */}
                  <div id={`method-${i}`} hidden={!on} className={on ? "lv-in" : undefined}>
                    <p className="max-w-[46ch] pb-6 pl-[3rem] text-[15px] leading-relaxed text-tv-paper/85">{s.body}</p>
                    {!picked && on && (
                      <span aria-hidden className="mb-5 ml-[3rem] block h-px w-24 overflow-hidden bg-tv-line motion-reduce:hidden">
                        <span className="block h-full w-full origin-left bg-tv-signal" style={{ animation: `nudge ${s.secs}s linear both` }} />
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="tv-eyebrow mt-6 text-tv-mutedesk">Pick a step. The demo on the right is live.</p>
        </div>

        <div data-reveal="card" className="min-h-[460px] md:sticky md:top-24 md:self-start">
          <div key={open} className="lv-in h-full">
            {open === 0 && <FilterDemo onLoop={next} />}
            {open === 1 && <ReadDemo d={read} onLoop={next} />}
            {open === 2 && <PlanDemo d={plan} onLoop={next} />}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
