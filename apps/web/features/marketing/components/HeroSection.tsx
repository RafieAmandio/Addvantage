import Link from "next/link";
import type { HeroData } from "@/features/marketing/lib/landing";
import { HeroDesk } from "@/features/marketing/components/HeroDesk";
import { Magnet } from "@/features/marketing/components/Magnet";
import { Roll } from "@/features/marketing/components/Roll";
import { Jitter } from "@/features/marketing/components/ScrambleReveal";
import { GRAIN_URL } from "@/features/marketing/components/iso/Iso";


const LINKS = [
  ["Lab", "#method"],
  ["Journal", "#train"],
  ["Access", "#access"],
];

/**
 * Clear over the hero, Paper with a hairline once the page moves; tucks away reading down.
 * `home` is "" on the landing (in-page anchors, so Lenis glides) and "/" anywhere else.
 */
export function MarketingNav({ home = "" }: { home?: "" | "/" }) {
  return (
    <header className="lv-header fixed inset-x-0 top-0 z-50">
      <div className="px-4 md:px-8">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between md:h-[72px]">
          <Link href="/" className="flex items-center" aria-label="TradeVantage home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockup-paper.svg" alt="+ vantage" width={319} height={73} className="h-[26px] w-auto md:h-[30px]" />
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-8 text-[15px] text-tv-ink md:flex">
            {LINKS.map(([l, h]) => (
              <a key={l} href={`${home}${h}`} className="tv-link py-1">
                {l}
              </a>
            ))}
            <Link href="/faq" className="tv-link py-1">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/login" className="tv-btn tv-btn-sm px-3 text-tv-ink">
              <Roll label="Log in" />
            </Link>
            <Link href="/signup" className="tv-btn tv-btn-sm tv-btn-ink">
              <Roll label="Request access" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export function HeroSection({ hero }: { hero: HeroData }) {
  return (
    <section style={{ ["--tv-grain" as string]: `url("${GRAIN_URL}")` }} className="tv-grain relative z-10 flex flex-1 flex-col justify-center overflow-hidden bg-tv-paper pt-24 text-tv-ink md:pt-20">
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-y-6 px-4 sm:px-6 md:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] md:gap-x-4 md:px-8 md:pb-16">
        <div className="relative z-10 flex flex-col items-start md:py-10">
          <p className="tv-eyebrow text-tv-mute">TradeVantage / daily desk</p>
          <h1 className="mt-5 text-[clamp(2.75rem,5vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
            <span className="block">Read the market.</span>
            <span className="block">
              Not the <Jitter text="noise" />.
            </span>
          </h1>
          <p className="mt-6 max-w-[34rem] text-[17px] leading-[1.55] text-tv-graphite md:text-lg">
            Directional outlook and macro alpha intelligence. A market radar powered by AI and professionals, built for experienced traders.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Magnet>
              <Link href="/signup" className="tv-btn tv-btn-ink w-full sm:w-auto">
                <Roll label="Request access" />
                <span aria-hidden className="tv-arrow">
                  →
                </span>
              </Link>
            </Magnet>
            <Link href="/login" className="tv-btn tv-btn-line">
              <Roll label="Log in" />
            </Link>
          </div>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.08em] text-tv-mute">
            Free tier, no card · 2% max risk built in<span className="hidden sm:inline"> · </span>
            <br className="sm:hidden" />
            No signals to copy
          </p>
          <a href="#method" className="tv-link mt-6 text-[15px] font-medium">
            See the lab <span aria-hidden className="tv-arrow">↓</span>
          </a>
          {/* ponytail: partner claim pending the signed BingX deal and their official logo files; delete this block if it falls through. */}
          <p className="mt-10 flex items-center gap-4 border-t border-tv-stone pt-5">
            <span className="tv-eyebrow text-tv-mute">Exchange partner</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/partners/bingx.svg" alt="BingX" width={83} height={24} className="tv-partner h-6 w-auto" />
          </p>
        </div>

        <figure className="relative pb-6 md:-ml-10 md:-mr-24 md:pb-0">
          <HeroDesk d={hero} />
        </figure>
      </div>
    </section>
  );
}
