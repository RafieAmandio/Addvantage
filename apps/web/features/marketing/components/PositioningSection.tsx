import { Frame } from "@/features/marketing/components/Frame";
import { LazyModel } from "@/features/marketing/components/ModelViewer";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";
import { IconCheckBox, IconCloseSquare } from "@/features/marketing/components/icons";

const FOR = ["Experienced market participants leveling up their edge.", "Traders who need a second-opinion copilot for blind-spot coverage."];

/** What this is, who it isn't for, who it is for: the old page's three columns, kept word for word. */
export function PositioningSection() {
  return (
    <Frame id="positioning" label="Positioning" num="01">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr_1px_1fr]">
        <div data-reveal style={{ ["--i" as string]: 0 }} className="relative flex min-h-[420px] flex-col gap-3 overflow-hidden bg-white p-6 text-black md:min-h-[560px] md:p-12">
          <h2 className="font-mono text-2xl font-bold leading-none md:text-[36px]">
            <Scramble text="What this is" />
          </h2>
          <p className="relative z-10 font-mono text-base font-light leading-[1.4]">A market radar powered by AI and professionals, created for experienced traders and investors.</p>
          {/* Oversized and cropped by the card's bottom edge. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
            <div className="aspect-square w-[96%] translate-y-[20%]">
              <LazyModel src="/models/what-this-is.glb" poster="/figma/what-this-is.png" radius="82%" idleSpeed={8} scrollSpin={110} pointerTrack={7} basePhi={80} />
            </div>
          </div>
        </div>

        <div data-reveal="vline" className="hidden bg-white/20 md:block" style={{ ["--i" as string]: 1 }} />

        <div data-reveal style={{ ["--i" as string]: 1 }} className="flex flex-col gap-6 border-t border-white/20 p-6 md:gap-9 md:border-t-0 md:p-12">
          <h3 className="font-mono text-2xl font-bold">
            <Scramble text="Who this is not for" delay={150} />
          </h3>
          <ul className="flex flex-col gap-4">
            {["Beginners", "Gamblers", "Hobbyists"].map((x, i) => (
              <li key={x} data-reveal style={{ ["--i" as string]: i + 2 }} className="flex items-center gap-2">
                <IconCloseSquare className="h-6 w-6 shrink-0 text-blood-bright" />
                <span className="font-mono text-base font-light leading-[1.4] text-blood-bright line-through">{x}</span>
              </li>
            ))}
            <li data-reveal style={{ ["--i" as string]: 5 }} className="font-mono text-base font-light leading-[1.4]">
              We don&apos;t soften this.
              <br />
              Onboarding is a filter, not a funnel.
            </li>
          </ul>
        </div>

        <div data-reveal="vline" className="hidden bg-white/20 md:block" style={{ ["--i" as string]: 2 }} />

        <div data-reveal style={{ ["--i" as string]: 2 }} className="flex flex-col gap-6 border-t border-white/20 p-6 md:gap-9 md:border-t-0 md:p-12">
          <h3 className="font-mono text-2xl font-bold">
            <Scramble text="Who this is for" delay={300} />
          </h3>
          <ul className="flex flex-col gap-4">
            {FOR.map((x, i) => (
              <li key={x} data-reveal style={{ ["--i" as string]: i + 3 }} className="flex items-start gap-4">
                <IconCheckBox className="h-6 w-6 shrink-0 text-brand" />
                <span className="font-mono text-base font-light leading-[1.4]">{x}</span>
              </li>
            ))}
            <li data-reveal style={{ ["--i" as string]: 5 }} className="flex items-start gap-4">
              <IconCheckBox className="h-6 w-6 shrink-0 text-brand" />
              <span className="font-mono text-base font-light leading-[1.4]">
                Anyone who wants to activate <span className="text-brand">Six Eyes</span> on the market.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </Frame>
  );
}
