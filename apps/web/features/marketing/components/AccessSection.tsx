import Link from "next/link";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";
import { Roll } from "@/features/marketing/components/HeroSection";
import { ArrowUpPixel, IconCloseSquare } from "@/features/marketing/components/icons";

const FREE = ["Unfiltered news + impact analysis", "Economic calendar", "My Channel (founder broadcast)", "Public psychology primers"];
const VIP = ["Everything in Free", "Daily / weekly Trading Plan", "1v1 Consultation (founders)", "Full Education library", "Hashtag explorer (full)", "All collab channels"];

/** A full-bleed rule that draws itself across the page. */
const Rule = ({ from = "left" }: { from?: "left" | "right" }) => (
  <div className="w-full overflow-hidden">
    <div data-reveal="line" className="h-px bg-white/40" style={{ transformOrigin: from }} />
  </div>
);

/** The old page's framed block: a header bar, rules that bleed off both edges, two tiers side by side. */
export function AccessSection() {
  return (
    <section id="access" className="relative z-10 bg-black pb-20 text-white md:pb-32">
      <div className="mx-4 border-x border-white/20 sm:mx-6 md:mx-[100px]">
        <div data-reveal className="flex items-center justify-between px-6 py-4 font-mono text-base font-bold md:px-8">
          <Scramble text="Access" />
          <span className="text-brand">
            <Scramble text="04" delay={150} />
          </span>
        </div>
      </div>
      <Rule />

      <div className="mx-4 border-x border-white/20 sm:mx-6 md:mx-[100px]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr]">
          <div data-reveal style={{ ["--i" as string]: 1 }} className="flex flex-col gap-6 p-6 md:p-12">
            <p className="flex items-center justify-between font-mono text-base">
              <span className="font-light">Tier 00</span>
              <span className="font-bold text-brand">Free</span>
            </p>
            <p className="font-mono text-[clamp(2.5rem,6vw,64px)] font-bold leading-[1.2] tabular-nums">
              <Scramble text="IDR 0" delay={200} duration={800} />
            </p>
            <p className="font-mono text-base font-light">No commitment</p>
            <ul className="ml-6 flex list-disc flex-col gap-1 font-mono text-base font-light leading-[1.4]">
              {FREE.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <Link href="/signup" className="btn-pixel mt-auto flex w-full items-center justify-center border border-brand p-4 font-mono text-base font-bold text-brand">
              <Roll label="Start free" />
            </Link>
          </div>

          <div data-reveal="vline" className="hidden bg-white/20 md:block" style={{ ["--i" as string]: 2 }} />

          <div data-reveal style={{ ["--i" as string]: 2 }} className="flex flex-col gap-6 bg-white p-6 text-black md:p-12">
            <p className="flex items-center justify-between font-mono text-base">
              <span className="font-light">Tier 01</span>
              <span className="font-bold">VIP+ Trader</span>
            </p>
            <p className="whitespace-nowrap font-mono text-[clamp(1.9rem,4.4vw,64px)] font-bold leading-[1.2] tabular-nums">
              <Scramble text="IDR 18.000.000" delay={300} duration={900} />
            </p>
            <p className="font-mono text-base font-light">Per year · Annual commitment</p>
            <ul className="ml-6 flex list-disc flex-col gap-1 font-mono text-base font-light leading-[1.4]">
              {VIP.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <Link href="/signup" className="btn-pixel flex w-full items-center justify-center gap-4 bg-brand p-4 font-mono text-base font-bold text-black">
              <Roll label="Request access" />
              <ArrowUpPixel className="h-4 w-4 rotate-90" />
            </Link>
            <p className="font-mono text-base font-light leading-[1.4]">
              Liability waiver required at signup.
              <br />
              No exceptions.
            </p>
          </div>
        </div>
      </div>
      <Rule from="right" />

      <div className="mx-4 border-x border-white/20 sm:mx-6 md:mx-[100px]">
        <div className="flex flex-col gap-4 px-6 py-6 font-mono md:flex-row md:items-center md:justify-between md:px-8">
          <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-base">
            <span className="font-bold">Who this is not for</span>
            {["Beginners", "Gamblers", "Hobbyists"].map((x, i) => (
              <span key={x} data-reveal style={{ ["--i" as string]: i }} className="flex items-center gap-2 font-light text-blood-bright line-through">
                <IconCloseSquare className="h-5 w-5 shrink-0" />
                {x}
              </span>
            ))}
          </p>
          <p className="text-sm font-light text-white/85">We don&apos;t soften this. Onboarding is a filter, not a funnel.</p>
        </div>
      </div>
      <Rule />
    </section>
  );
}
