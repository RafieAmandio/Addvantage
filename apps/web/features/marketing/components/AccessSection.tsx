import Link from "next/link";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";
import { Frame } from "@/features/marketing/components/Frame";
import { Roll } from "@/features/marketing/components/HeroSection";
import { ArrowUpPixel } from "@/features/marketing/components/icons";

const FREE = ["Unfiltered news + impact analysis", "Economic calendar", "My Channel (founder broadcast)", "Public psychology primers"];
const VIP = ["Everything in Free", "Daily / weekly Trading Plan", "1v1 Consultation (founders)", "Full Education library", "Hashtag explorer (full)", "All collab channels"];

/** The old page's framed block: a header bar, rules that bleed off both edges, two tiers side by side. */
export function AccessSection() {
  return (
    <Frame id="access" label="Access" num="04" className="pb-20 md:pb-32">
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
    </Frame>
  );
}
