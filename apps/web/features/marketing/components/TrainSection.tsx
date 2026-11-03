import type { KillData, PracticeData, ScanData } from "@/features/marketing/lib/landing";
import { TrainTabs } from "./TrainTabs";
import { KillDemo } from "./demos/KillDemo";
import { PracticeDemo } from "./demos/PracticeDemo";
import { ScanDemo } from "./demos/ScanDemo";

/** The training tools on real candles, one sheet at a time on the desk. The practice drill is played for real. */
export function TrainSection({ practice, scan, kill }: { practice: PracticeData; scan: ScanData; kill: KillData }) {
  return (
    <section id="train" className="relative z-10 flex flex-col justify-center overflow-hidden bg-tv-paper py-16 text-tv-ink md:min-h-[100svh] md:py-[clamp(2.5rem,6svh,4rem)]">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 md:px-10">
        <div className="grid items-end gap-x-12 gap-y-4 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <h2 className="text-[clamp(2.4rem,min(5vw,8svh),4.25rem)] font-semibold leading-[0.98] tracking-[-0.035em]">Train your eye.</h2>
          <p className="max-w-[48ch] text-[17px] leading-relaxed text-tv-graphite">
            Reading a chart is a skill, so it gets practised like one. Real past markets, graded by the same rules the app trades on.
          </p>
        </div>

        <div className="mt-8 border-t border-tv-ink pt-6 md:mt-[clamp(1.5rem,4svh,2.5rem)]">
          <TrainTabs
            tabs={[
              {
                label: "Practice",
                title: "Tap the break. Then see what happened.",
                body: "A real hourly chart, cut at the moment the level was live. Find the candle that broke it, place the level and the stop, then reveal how it played out. Losses included.",
                demo: <PracticeDemo d={practice} />,
              },
              {
                label: "Morning scan",
                title: "Answer before the open.",
                body: "What printed yesterday, did the close break anything, is the day's range spent. Three questions, graded against what the candles actually show.",
                demo: <ScanDemo d={scan} />,
              },
              {
                label: "Kill list",
                title: "The trade you don't take.",
                body: "Daily loss limit, four losses in a row, a rule broken today, news inside fifteen minutes, nothing after 23:00 WIB. When one trips, the journal will not open the trade.",
                demo: <KillDemo d={kill} />,
              },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
