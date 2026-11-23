import Link from "next/link";
import { HeroRidge } from "@/features/marketing/components/HeroRidge";
import type { RidgeData } from "@/features/marketing/lib/landing";
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

function Copy() {
  return (
    <div className="relative z-10 flex flex-col items-center text-center">
      <h1 className="text-[clamp(2.75rem,6.6vw,6rem)] font-semibold leading-[0.92] tracking-[-0.04em]">
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
      {/* ponytail: partner claim pending the signed BingX deal and their official logo files; delete this block if it falls through. */}
      <p className="mt-7 flex items-center gap-4">
        <span className="tv-eyebrow text-tv-mute">Exchange partner</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/partners/bingx.svg" alt="BingX" width={83} height={24} className="tv-partner h-5 w-auto" />
      </p>
    </div>
  );
}

export function HeroSection({ ridge }: { ridge: RidgeData }) {
  return (
    <section style={{ ["--tv-grain" as string]: `url("${GRAIN_URL}")` }} className="tv-grain relative z-10 flex min-h-[600px] flex-1 flex-col overflow-hidden bg-tv-paper pt-24 text-tv-ink md:pt-28">
      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-4 sm:px-6">
        <Copy />
      </div>
      <HeroRidge d={ridge} className="relative mt-4 min-h-[260px] flex-1 md:min-h-[340px]" />
    </section>
  );
}
