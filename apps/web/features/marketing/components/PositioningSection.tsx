import type { TickerRow } from "@/features/marketing/lib/landing";
import { Frame } from "@/features/marketing/components/Frame";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";
import { TowersFigure } from "@/features/marketing/components/iso/Figures";

const FOR = ["Experienced market participants leveling up their edge.", "Traders who need a second-opinion copilot for blind-spot coverage."];

/** The guideline's hairline square bullet, crossed for "not for". */
const Mark = ({ no }: { no?: boolean }) => (
  <svg viewBox="0 0 14 14" className="mt-[5px] h-3.5 w-3.5 shrink-0" aria-hidden fill="none" stroke="currentColor" strokeWidth={1}>
    <rect x="0.5" y="0.5" width="13" height="13" />
    {no ? <path d="M4 4l6 6M10 4l-6 6" /> : <path d="M3.5 7.2l2.4 2.4 4.6-5" />}
  </svg>
);

/** What this is, who it isn't for, who it is for: the old page's three columns, kept word for word. */
export function PositioningSection({ markets }: { markets: TickerRow[] }) {
  return (
    <Frame id="positioning" label="Positioning" num="01">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr_1px_1fr]">
        <div data-reveal style={{ ["--i" as string]: 0 }} className="relative flex flex-col gap-3 bg-tv-white p-6 md:min-h-[560px] md:p-12">
          <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[36px]">
            <Scramble text="What this is" />
          </h2>
          <p className="relative z-10 text-[17px] leading-[1.5] text-tv-graphite">A market radar powered by AI and professionals, created for experienced traders and investors.</p>
          <TowersFigure markets={markets} className="mt-auto w-full pt-6" />
        </div>

        <div data-reveal="vline" className="hidden bg-tv-stone md:block" style={{ ["--i" as string]: 1 }} />

        <div data-reveal style={{ ["--i" as string]: 1 }} className="flex flex-col gap-6 border-t border-tv-stone p-6 md:gap-9 md:border-t-0 md:p-12">
          <h3 className="text-2xl font-semibold tracking-[-0.015em]">
            <Scramble text="Who this is not for" delay={150} />
          </h3>
          <ul className="flex flex-col gap-4">
            {["Beginners", "Gamblers", "Hobbyists"].map((x, i) => (
              <li key={x} data-reveal style={{ ["--i" as string]: i + 2 }} className="flex items-start gap-3 text-tv-mute">
                <Mark no />
                <span className="text-[17px] leading-[1.4] line-through decoration-1">{x}</span>
              </li>
            ))}
            <li data-reveal style={{ ["--i" as string]: 5 }} className="text-[17px] leading-[1.45]">
              We don&apos;t soften this.
              <br />
              Onboarding is a filter, not a funnel.
            </li>
          </ul>
        </div>

        <div data-reveal="vline" className="hidden bg-tv-stone md:block" style={{ ["--i" as string]: 2 }} />

        <div data-reveal style={{ ["--i" as string]: 2 }} className="flex flex-col gap-6 border-t border-tv-stone p-6 md:gap-9 md:border-t-0 md:p-12">
          <h3 className="text-2xl font-semibold tracking-[-0.015em]">
            <Scramble text="Who this is for" delay={300} />
          </h3>
          <ul className="flex flex-col gap-4">
            {FOR.map((x, i) => (
              <li key={x} data-reveal style={{ ["--i" as string]: i + 3 }} className="flex items-start gap-3">
                <Mark />
                <span className="text-[17px] leading-[1.45]">{x}</span>
              </li>
            ))}
            <li data-reveal style={{ ["--i" as string]: 5 }} className="flex items-start gap-3">
              <Mark />
              <span className="text-[17px] leading-[1.45]">
                Anyone who wants to activate <span className="font-semibold">Six Eyes</span> on the market.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </Frame>
  );
}
