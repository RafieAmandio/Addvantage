"use client";

import { useState } from "react";
import { GateScene } from "@/features/marketing/components/GateScene";

const FOR = [
  { t: "Experienced traders", d: "Market participants leveling up their edge." },
  { t: "Second opinion", d: "Traders who need a copilot for blind-spot coverage." },
  { t: "Six Eyes", d: "Anyone who wants to activate Six Eyes on the market." },
];
const NOT = ["Beginners", "Gamblers", "Hobbyists"];

/**
 * What this is, Heron style: a dithered scene on the left (a gate, one trader through it),
 * on the right who it is for as an accordion and who it is not for, struck.
 */
export function PositioningSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="positioning" className="relative z-10 bg-tv-paper text-tv-ink">
      <div className="mx-auto grid w-full max-w-[1440px] border-y border-tv-stone md:min-h-[100svh] md:grid-cols-2">
        <GateScene className="aspect-[4/5] w-full border-b border-tv-stone md:aspect-auto md:h-full md:border-b-0 md:border-r" />
        <div className="flex flex-col">
          <div className="px-4 pb-10 pt-10 sm:px-8 md:px-12 md:pt-14">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-tv-mute">What this is</p>
            <h2 className="mt-4 max-w-[14ch] text-[clamp(2.2rem,4vw,3.6rem)] font-semibold uppercase leading-[0.95] tracking-[-0.03em]">
              A market radar for experienced traders
            </h2>
            <p className="mt-5 max-w-[36ch] text-[17px] leading-[1.45] text-tv-mute">Powered by AI and professionals, created for traders and investors.</p>
          </div>

          <ul className="mt-auto border-t border-tv-stone">
            {FOR.map((f, i) => (
              <li key={f.t} className="border-b border-dashed border-tv-stone">
                <button
                  type="button"
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? -1 : i)}
                  className="flex w-full items-center justify-between px-4 py-4 text-left text-[clamp(1.1rem,1.6vw,1.4rem)] font-semibold uppercase tracking-[-0.01em] transition-colors hover:bg-tv-stone/40 sm:px-8 md:px-12"
                >
                  {f.t}
                  <span aria-hidden className="font-mono text-[20px] font-normal text-tv-mute">
                    {open === i ? "−" : "+"}
                  </span>
                </button>
                <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open === i ? "1fr" : "0fr" }}>
                  <p className="overflow-hidden px-4 text-[16px] leading-[1.45] sm:px-8 md:px-12">
                    <span className="block pb-4">{f.d}</span>
                  </p>
                </div>
              </li>
            ))}
            <li className="px-4 pb-2 pt-6 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-tv-mute sm:px-8 md:px-12">Not for</li>
            {NOT.map((n) => (
              <li key={n} className="border-b border-dashed border-tv-stone px-4 py-4 text-[clamp(1.1rem,1.6vw,1.4rem)] font-semibold uppercase tracking-[-0.01em] text-tv-mutedesk line-through decoration-tv-ink decoration-2 sm:px-8 md:px-12">
                {n}
              </li>
            ))}
          </ul>

          <p className="px-4 py-8 text-[17px] leading-[1.45] sm:px-8 md:px-12">
            We don&apos;t soften this. <span className="font-semibold">Onboarding is a <span className="bg-tv-signal px-1">filter</span>, not a funnel.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
