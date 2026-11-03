import { barText, exact, type KillData, type PracticeData, type ScanData } from "@/features/marketing/lib/landing";
import { CandlesFigure } from "@/features/marketing/components/iso/Figures";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";
import { KillDemo } from "./demos/KillDemo";
import { PracticeDemo } from "./demos/PracticeDemo";
import { ScanDemo } from "./demos/ScanDemo";

function Tool({ label, title, body, children, i, className }: { label: string; title: string; body: string; children: React.ReactNode; i: number; className?: string }) {
  return (
    <article data-reveal="card" style={{ ["--i" as string]: i }} className={className}>
      {children}
      <div className="mt-5 max-w-[52ch]">
        <p className="tv-eyebrow text-tv-mute">{label}</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.02em] md:text-[28px]">{title}</h3>
        <p className="mt-2 text-[16px] leading-relaxed text-tv-graphite">{body}</p>
      </div>
    </article>
  );
}

/** The training tools, each one running by itself on real candles. */
export function TrainSection({ practice, scan, kill }: { practice: PracticeData; scan: ScanData; kill: KillData }) {
  return (
    <section id="train" className="relative z-10 overflow-hidden bg-tv-paper py-20 text-tv-ink md:py-32">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 md:px-10">
        <div className="grid items-end gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <p data-reveal className="tv-eyebrow text-tv-mute">Training</p>
            <h2 data-reveal className="mt-5 text-[clamp(2.4rem,5.6vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
              <Scramble text="Train your eye." />
            </h2>
            <p data-reveal style={{ ["--i" as string]: 1 }} className="mt-5 max-w-[42ch] text-[17px] leading-relaxed text-tv-graphite">
              Reading a chart is a skill, so it gets practised like one. Real past markets, graded by the same rules the app trades on.
            </p>
          </div>
          <CandlesFigure sym={practice.sym} bars={practice.bars.slice(-3)} text={practice.bars.slice(-3).map(barText)} high={exact(practice.bars.at(-1)![2])} className="mx-auto w-full max-w-[380px] md:mr-0" />
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-16 md:mt-20 md:grid-cols-12">
          <Tool
            i={0}
            className="md:col-span-7"
            label="Practice"
            title="Tap the break. Then see what happened."
            body="A real hourly chart, cut at the moment the level was live. Find the candle that broke it, place the level and the stop, then reveal how it played out. Losses included."
          >
            <PracticeDemo d={practice} />
          </Tool>
          <Tool
            i={1}
            className="md:col-span-5 md:mt-24"
            label="Morning scan"
            title="Answer before the open."
            body="What printed yesterday, did the close break anything, is the day's range spent. Three questions, graded against what the candles actually show."
          >
            <ScanDemo d={scan} />
          </Tool>
          <Tool
            i={0}
            className="md:col-span-10 md:col-start-2"
            label="Kill list"
            title="The trade you don't take."
            body="Daily loss limit, four losses in a row, a rule broken today, news inside fifteen minutes, nothing after 23:00 WIB. When one trips, the journal will not open the trade."
          >
            <KillDemo d={kill} />
          </Tool>
        </div>
      </div>
    </section>
  );
}
