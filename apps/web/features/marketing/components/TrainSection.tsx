import type { KillData, PracticeData, ScanData } from "@/features/marketing/lib/landing";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";
import { KillDemo } from "./demos/KillDemo";
import { PracticeDemo } from "./demos/PracticeDemo";
import { ScanDemo } from "./demos/ScanDemo";

function Tool({ label, title, body, children, i, r, className }: { label: string; title: string; body: string; children: React.ReactNode; i: number; r: string; className?: string }) {
  return (
    <article data-reveal="card" style={{ ["--i" as string]: i, ["--r" as string]: r }} className={className}>
      {children}
      <div className="mt-5 max-w-[52ch] text-black">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-black/65">{label}</p>
        <h3 className="mt-1.5 text-2xl font-bold tracking-[-0.02em] md:text-[28px]">{title}</h3>
        <p className="mt-2 font-mono text-sm leading-relaxed text-black/80">{body}</p>
      </div>
    </article>
  );
}

/** The training tools, each one running by itself on real candles. */
export function TrainSection({ practice, scan, kill }: { practice: PracticeData; scan: ScanData; kill: KillData }) {
  return (
    <section id="train" className="relative z-10 overflow-hidden bg-white py-20 text-black md:py-32">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 md:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 data-reveal className="text-[clamp(2.4rem,6vw,5rem)] font-bold leading-[0.95] tracking-[-0.03em]">
            <Scramble text="Train your eye." />
          </h2>
          <p data-reveal style={{ ["--i" as string]: 1 }} className="max-w-[42ch] font-mono text-sm leading-relaxed text-black/80">
            Reading a chart is a skill, so it gets practised like one. Real past markets, graded by the same rules the app trades on.
          </p>
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-16 md:mt-20 md:grid-cols-12">
          <Tool
            i={0}
            r="-3deg"
            className="md:col-span-7"
            label="Practice"
            title="Tap the break. Then see what happened."
            body="A real hourly chart, cut at the moment the level was live. Find the candle that broke it, place the level and the stop, then reveal how it played out. Losses included."
          >
            <PracticeDemo d={practice} />
          </Tool>
          <Tool
            i={1}
            r="3deg"
            className="md:col-span-5 md:mt-24"
            label="Morning scan"
            title="Answer before the open."
            body="What printed yesterday, did the close break anything, is the day's range spent. Three questions, graded against what the candles actually show."
          >
            <ScanDemo d={scan} />
          </Tool>
          <Tool
            i={0}
            r="-2deg"
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
