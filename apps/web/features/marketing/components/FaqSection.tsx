"use client";

import { useRef } from "react";
import { useCursorGrid, cursorGrid } from "@/features/marketing/lib/use-cursor-grid";
import { faq } from "@/features/marketing/lib/data";
import { LazyModel } from "@/features/marketing/components/ModelViewer";
import { Frame } from "@/features/marketing/components/Frame";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";

export function FaqSection() {
  const ref = useRef<HTMLDivElement>(null);
  const m = useCursorGrid(ref);

  return (
    <Frame id="faq" label="Frequent Interrogations" num="03">
      <div ref={ref} className="relative grid grid-cols-1 md:grid-cols-[1fr_1px_1fr]">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300" style={cursorGrid(m)} />
        <div className="relative min-h-[460px] overflow-hidden p-6 md:min-h-[680px] md:p-12">
          <h2 data-reveal className="relative z-10 font-mono text-[clamp(2rem,5.4vw,64px)] font-bold leading-none">
            <Scramble text="Where's the Discord?" duration={900} />
          </h2>
          <p data-reveal style={{ ["--i" as string]: 1 }} className="relative z-10 mt-3 font-mono text-2xl leading-[1.4]">
            <span className="font-light">Nowhere. </span>
            <span className="font-bold text-brand">4 Reasons.</span>
          </p>
          <div data-reveal="pop" style={{ ["--i" as string]: 2 }} className="pointer-events-none absolute -left-[12%] -right-[12%] bottom-[-14%] top-[26%] md:-left-[30%] md:-right-[10%] md:bottom-[-24%] md:top-[24%]">
            <LazyModel src="/models/discord.glb" poster="/figma/discord.png" idleSpeed={4} scrollSpin={60} pointerTrack={3} basePhi={84} />
          </div>
        </div>
        <div data-reveal="vline" className="hidden bg-white/20 md:block" />
        <ol className="relative z-10 flex flex-col border-t border-white/20 md:border-t-0">
          {faq.map((f, i) => (
            <li key={f.q} data-reveal style={{ ["--i" as string]: i }} className="flex flex-col gap-2 border-b border-white/20 p-6 last:border-b-0 md:p-12">
              <p className="font-mono text-base font-light text-white/70">
                Reason <span className="text-brand">{String(i + 1).padStart(2, "0")}</span>
              </p>
              <h3 className="font-mono text-2xl font-bold leading-[1.4]">
                <Scramble text={f.q} delay={120 + i * 120} />
              </h3>
              <p className="max-w-[52ch] font-mono text-base font-light leading-[1.5] text-white/85">{f.a}</p>
            </li>
          ))}
        </ol>
      </div>
    </Frame>
  );
}
