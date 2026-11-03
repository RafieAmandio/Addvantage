"use client";

import { useRef } from "react";
import { useCursorGrid, cursorGrid } from "@/features/marketing/lib/use-cursor-grid";
import { faq } from "@/features/marketing/lib/data";
import { DiscordFigure } from "@/features/marketing/components/iso/Figures";

/**
 * The FAQ page: four reasons there is no Discord, as a native accordion (keyboard and
 * find-in-page for free), the first one open, beside the chat server with its plug pulled.
 * The hairline grid follows the pointer inside the section.
 */
export function FaqSection() {
  const ref = useRef<HTMLDivElement>(null);
  const m = useCursorGrid(ref);

  return (
    <section id="faq" className="relative z-10 bg-tv-paper pb-20 pt-28 text-tv-ink md:pb-28 md:pt-40">
      <div ref={ref} className="relative mx-auto grid w-full max-w-[1240px] gap-y-12 px-4 sm:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-x-16 md:px-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300" style={cursorGrid(m)} />
        <div className="relative z-10 flex flex-col">
          <h1 className="text-[clamp(2.6rem,5.4vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.035em]">Where&apos;s the Discord?</h1>
          <p className="mt-5 text-2xl leading-[1.4]">
            <span className="text-tv-mute">Nowhere. </span>
            <span className="font-semibold">4 Reasons.</span>
          </p>
          <DiscordFigure className="mt-10 w-full max-w-[400px] md:mt-16" />
        </div>
        <div className="relative z-10 border-t border-tv-ink md:mt-3">
          {faq.map((f, i) => (
            <details key={f.q} open={i === 0} className="tv-acc border-b border-tv-stone">
              <summary className="grid grid-cols-[2.25rem_1fr_auto] items-baseline gap-x-3 py-6 md:py-7">
                <span className="font-mono text-[12px] tabular-nums text-tv-mute">{String(i + 1).padStart(2, "0")}</span>
                <span className="tv-q text-[22px] font-semibold leading-[1.3] tracking-[-0.015em] transition-colors duration-200 md:text-[26px]">{f.q}</span>
                <span aria-hidden className="tv-plus font-mono text-xl leading-none">
                  +
                </span>
              </summary>
              <div className="tv-acc-body -mt-2 pb-7 pl-[3rem] pr-8">
                <p className="max-w-[54ch] text-[17px] leading-[1.6] text-tv-graphite">{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
