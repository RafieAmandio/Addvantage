import { GRAIN_URL } from "@/features/marketing/components/iso/Iso";
import { RadarScene } from "@/features/marketing/components/RadarScene";

const FOR = ["Experienced market participants leveling up their edge.", "Traders who need a second-opinion copilot for blind-spot coverage.", "Anyone who wants to activate Six Eyes on the market."];
const NOT = ["Beginners", "Gamblers", "Hobbyists"];

/**
 * What this is, laid out like the auth pages: the words on the left, the radar scene in a full
 * height panel on the right.
 */
export function PositioningSection() {
  return (
    <section id="positioning" className="relative z-10 border-y border-tv-stone bg-tv-paper text-tv-ink md:grid md:min-h-[100svh] md:grid-cols-2">
      <div className="flex items-center px-4 py-16 sm:px-6 md:px-12">
        <div className="mx-auto w-full max-w-[480px]">
          <h2 className="text-[clamp(2.2rem,3.8vw,3.4rem)] font-semibold leading-[1] tracking-[-0.035em]">A market radar for experienced traders.</h2>
          <p className="mt-5 text-[18px] leading-[1.45] text-tv-graphite">Powered by AI and professionals, created for traders and investors.</p>

          <div className="mt-10 grid gap-8 border-t border-tv-stone pt-8 sm:grid-cols-[1fr_auto] sm:gap-12">
            <div>
              <h3 className="text-[15px] font-semibold">Who this is for</h3>
              <ul className="mt-3 flex flex-col gap-3 text-[16px] leading-[1.45]">
                {FOR.map((x) => (
                  <li key={x} className="flex gap-2.5">
                    <span aria-hidden className="mt-[0.55em] size-2 shrink-0 bg-tv-signal" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold">Not for</h3>
              <ul className="mt-3 flex flex-col gap-3 text-[16px] leading-[1.45] text-tv-mute">
                {NOT.map((x) => (
                  <li key={x} className="line-through">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-10 text-[17px] leading-[1.45]">
            We don&apos;t soften this. <span className="font-semibold">Onboarding is a filter, not a funnel.</span>
          </p>
        </div>
      </div>
      <div style={{ ["--tv-grain" as string]: `url("${GRAIN_URL}")` }} className="tv-grain relative h-[115vw] max-h-[640px] overflow-hidden md:h-auto md:max-h-none border-t border-tv-stone md:border-l md:border-t-0">
        <RadarScene className="absolute inset-0 h-full w-full" />
      </div>
    </section>
  );
}
