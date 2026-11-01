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
    <section id="method" className="relative z-10 bg-black py-20 text-white md:py-32">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-4 sm:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 md:px-10">
        <div className="flex flex-col">
          <h2 data-reveal className="text-[clamp(2.4rem,5.5vw,4.5rem)] font-bold leading-[0.98] tracking-[-0.03em]">
            <Scramble text="Filter. Read." />
            <br />
            <span className="text-brand">
              <Scramble text="Execute." delay={250} />
            </span>
          </h2>
          <p data-reveal style={{ ["--i" as string]: 1 }} className="mt-5 max-w-[40ch] font-mono text-sm leading-relaxed text-white/70">
            Signals tell you what to do. This shows you how to see it, then stops you when you don&apos;t.
          </p>

          <ol className="mt-10 border-t border-white/15">
            {STEPS.map((s, i) => {
              const on = open === i;
              return (
                <li key={s.title} data-reveal style={{ ["--i" as string]: i + 2 }} className="border-b border-white/15">
                  <button
                    type="button"
                    aria-expanded={on}
                    aria-controls={`method-${i}`}
                    onClick={() => {
                      setOpen(i);
                      setPicked(true);
                    }}
                    className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-2 py-5 text-left focus-visible:outline-offset-4"
                  >
                    <span className={cn("font-mono text-sm tabular-nums transition-colors", on ? "text-brand" : "text-white/45")}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={cn("text-2xl font-bold tracking-[-0.02em] transition-colors md:text-3xl", on ? "text-white" : "text-white/55 group-hover:text-white")}>{s.title}</span>
                    <span aria-hidden className={cn("font-mono text-lg transition-transform duration-300", on ? "rotate-45 text-brand" : "text-white/45")}>
                      +
                    </span>
                    <span className="col-start-2 col-end-4 mt-1 font-mono text-sm text-white/60">{s.line}</span>
                  </button>
                  <div id={`method-${i}`} className={cn("grid transition-[grid-template-rows] duration-500 ease-out", on ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <p className="max-w-[46ch] pb-6 pl-[3rem] font-mono text-sm leading-relaxed text-white/85">{s.body}</p>
                      {!picked && on && (
                        <span aria-hidden className="mb-5 ml-[3rem] block h-px w-24 overflow-hidden bg-white/15 motion-reduce:hidden">
                          <span className="block h-full w-full origin-left bg-brand" style={{ animation: `nudge ${s.secs}s linear both` }} />
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-white/45">Pick a step. The demo on the right is live.</p>
        </div>

        <div data-reveal="card" style={{ ["--r" as string]: "2deg" }} className="min-h-[460px] md:sticky md:top-24 md:self-start">
          <div key={open} className="lv-in h-full">
            {open === 0 && <FilterDemo onLoop={next} />}
            {open === 1 && <ReadDemo d={read} onLoop={next} />}
            {open === 2 && <PlanDemo d={plan} onLoop={next} />}
          </div>
        </div>
      </div>
    </section>
  );
}
