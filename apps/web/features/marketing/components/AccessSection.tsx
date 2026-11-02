import Link from "next/link";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";
import { Frame } from "@/features/marketing/components/Frame";
import { Roll } from "@/features/marketing/components/Roll";
import { Build } from "@/features/marketing/components/iso/Build";

const FREE = ["Unfiltered news + impact analysis", "Economic calendar", "My Channel (founder broadcast)", "Public psychology primers"];
const VIP = ["Everything in Free", "Daily / weekly Trading Plan", "1v1 Consultation (founders)", "Full Education library", "Hashtag explorer (full)", "All collab channels"];

const List = ({ items }: { items: string[] }) => (
  <ul className="flex flex-col gap-2 text-[16px] leading-[1.45]">
    {items.map((x) => (
      <li key={x} className="flex items-start gap-3">
        <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 bg-current" />
        {x}
      </li>
    ))}
  </ul>
);

/** Two tiers side by side. VIP+ is pro equipment: the kit's isometric VIP card slides onto the desk. */
export function AccessSection() {
  return (
    <Frame id="access" label="Access" num="04" className="pb-20 md:pb-32">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr]">
        <div data-reveal style={{ ["--i" as string]: 1 }} className="flex flex-col gap-6 p-6 md:p-12">
          <p className="tv-eyebrow flex items-center justify-between">
            <span className="text-tv-mute">Tier 00</span>
            <span>Free</span>
          </p>
          <p className="font-mono text-[clamp(2.5rem,5.4vw,60px)] font-medium leading-[1.15] tabular-nums tracking-[-0.02em]">
            <Scramble text="IDR 0" delay={200} duration={800} />
          </p>
          <p className="text-tv-mute">No commitment</p>
          <List items={FREE} />
          <Link href="/signup" className="tv-btn tv-btn-line mt-auto w-full">
            <Roll label="Start free" />
          </Link>
        </div>

        <div data-reveal="vline" className="hidden bg-tv-stone md:block" style={{ ["--i" as string]: 2 }} />

        <div data-reveal style={{ ["--i" as string]: 2 }} className="tv-card group relative flex flex-col gap-6 border-t border-tv-stone bg-tv-white p-6 md:border-t-0 md:p-12">
          <p className="tv-eyebrow flex items-center justify-between">
            <span className="text-tv-mute">Tier 01</span>
            <span>VIP+ Trader</span>
          </p>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <p className="whitespace-nowrap font-mono text-[clamp(1.9rem,4.2vw,60px)] font-medium leading-[1.15] tabular-nums tracking-[-0.02em]">
              <Scramble text="IDR 18.000.000" delay={300} duration={900} />
            </p>
          </div>
          <p className="text-tv-mute">Per year · Annual commitment</p>
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_minmax(0,220px)]">
            <List items={VIP} />
            <Build className="tv-card-obj order-first sm:order-none">
              <div data-build="" data-dx="-60" data-dy="34" data-fade="" data-at="150">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/vip-card.svg" alt="The VIP+ member card, drawn on the desk" width={390} height={237} className="h-auto w-full max-w-[260px]" loading="lazy" />
              </div>
            </Build>
          </div>
          <Link href="/signup" className="tv-btn tv-btn-ink w-full">
            <Roll label="Request access" />
            <span aria-hidden className="tv-arrow">
              →
            </span>
          </Link>
          <p className="text-[15px] leading-[1.45] text-tv-graphite">
            Liability waiver required at signup.
            <br />
            No exceptions.
          </p>
        </div>
      </div>
    </Frame>
  );
}
