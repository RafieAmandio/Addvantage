"use client";

import { useRef } from "react";
import { useCursorGrid, cursorGrid } from "@/features/marketing/lib/use-cursor-grid";
import { faq } from "@/features/marketing/lib/data";
import { Frame } from "@/features/marketing/components/Frame";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";
import { JournalFigure } from "@/features/marketing/components/iso/Figures";

/**
 * Where's the Discord: four reasons as a native accordion (keyboard and find-in-page for free),
 * the first one open. The hairline grid follows the pointer inside the section.
 */
export function FaqSection() {
  const ref = useRef<HTMLDivElement>(null);
  const m = useCursorGrid(ref);

  return (
    <Frame id="faq" label="Frequent Interrogations" num="03">
      <div ref={ref} className="relative grid grid-cols-1 md:grid-cols-[1fr_1px_1fr]">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300" style={cursorGrid(m)} />
        <div className="relative flex flex-col p-6 md:min-h-[560px] md:p-12">
          <h2 data-reveal className="relative z-10 text-[clamp(2.2rem,5vw,60px)] font-semibold leading-none tracking-[-0.035em]">
            <Scramble text="Where's the Discord?" duration={900} />
          </h2>
          <p data-reveal style={{ ["--i" as string]: 1 }} className="relative z-10 mt-4 text-2xl leading-[1.4]">
            <span className="text-tv-mute">Nowhere. </span>
            <span className="font-semibold">4 Reasons.</span>
          </p>
          <JournalFigure className="relative z-10 mt-auto w-full max-w-[420px] pt-10" />
        </div>
        <div data-reveal="vline" className="hidden bg-tv-stone md:block" />
        <div className="relative z-10 flex flex-col border-t border-tv-stone md:border-t-0">
          {faq.map((f, i) => (
            <details key={f.q} data-reveal open={i === 0} style={{ ["--i" as string]: i }} className="tv-acc border-b border-tv-stone last:border-b-0">
              <summary className="flex items-start gap-4 p-6 md:px-12 md:py-8">
                <span className="mt-1.5 font-mono text-[12px] text-tv-mute">{String(i + 1).padStart(2, "0")}</span>
                <span className="tv-q flex-1 text-[22px] font-semibold leading-[1.3] tracking-[-0.015em] transition-colors duration-200">
                  <Scramble text={f.q} delay={120 + i * 120} />
                </span>
                <span aria-hidden className="tv-plus mt-1 font-mono text-xl leading-none">
                  +
                </span>
              </summary>
              <div className="tv-acc-body -mt-2 pb-7 pl-[3.25rem] pr-6 md:pl-[5.25rem] md:pr-12">
                <p className="max-w-[52ch] text-[16px] leading-[1.55] text-tv-graphite">{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </Frame>
  );
}
