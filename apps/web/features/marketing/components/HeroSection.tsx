"use client";

import Link from "next/link";
import type { LevelRound, TickerRow } from "@/features/marketing/lib/landing";
import { LevelCard } from "@/features/marketing/components/LevelCard";

/** A button label that rolls up on hover. */
export function Roll({ label }: { label: string }) {
  return (
    <span className="lv-roll" data-label={label}>
      <span>{label}</span>
    </span>
  );
}

export function MarketingNav() {
  return (
    <header className="lv-header fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-5 sm:px-6 md:px-[100px] md:py-8">
      <Link href="/" className="group flex items-center" aria-label="+vantage home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-vantage.png" alt="+vantage" width={319} height={73} className="h-7 w-auto transition-transform duration-300 ease-out group-hover:scale-110 md:h-8" />
      </Link>
      <nav className="flex items-center gap-2 sm:gap-4">
        <Link href="/login" className="px-2 py-2 font-mono text-sm font-bold text-white hover:text-brand md:text-base">
          <Roll label="Log in" />
        </Link>
        <Link href="/signup" className="btn-pixel rounded-[10px] bg-brand px-3 py-2 font-mono text-sm font-bold text-black md:px-4 md:text-base">
          <Roll label="Request access" />
        </Link>
      </nav>
    </header>
  );
}

/** Kaoba's pen ring: drawn once on load, still under reduced motion. */
function Ring() {
  return (
    <svg aria-hidden viewBox="0 0 300 110" preserveAspectRatio="none" className="pointer-events-none absolute -inset-x-[9%] -inset-y-[20%] h-[140%] w-[118%] overflow-visible">
      <path
        d="M24 62 C 18 22, 140 6, 232 14 C 296 20, 302 72, 246 92 C 178 112, 52 104, 24 74 C 12 60, 30 40, 66 30"
        pathLength={1}
        fill="none"
        stroke="#FFD400"
        strokeWidth={5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="lv-ring"
      />
    </svg>
  );
}

const CHECKS = ["Free tier, no card", "2% max risk, built in", "No signals to copy"];

export function HeroSection({ ticker, rounds }: { ticker: TickerRow[]; rounds: LevelRound[] }) {
  return (
    <section className="relative z-10 flex min-h-[100svh] flex-col overflow-hidden bg-gray">
      <div className="mx-auto grid w-full max-w-[1240px] flex-1 items-center gap-12 px-4 pb-14 pt-[112px] sm:px-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-16 md:px-10 md:pt-[140px]">
        <div className="flex flex-col">
          <p className="font-mono text-xs text-white/60 md:text-sm">
            <span className="font-bold text-brand">+vantage</span> · market intelligence for traders
          </p>
          <h1 className="mt-5 font-sans text-[clamp(2.4rem,4.7vw,4.5rem)] leading-[1.02] [&>span]:whitespace-nowrap tracking-[-0.035em] text-white">
            <span className="block font-normal">Read the market.</span>
            <span className="block font-bold">
              Not the{" "}
              <span className="relative ml-[0.06em] inline-block">
                noise
                <Ring />
              </span>
              <span className="text-brand">.</span>
            </span>
          </h1>
          <p className="mt-7 max-w-[50ch] font-mono text-sm leading-[1.6] text-white/80 md:text-base">
            Directional Outlook &amp; Macro Alpha Intelligence, a market radar powered by AI and professionals, built for experienced traders.
          </p>
          <hr className="my-8 max-w-[560px] border-white/15" />
          <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link href="/signup" className="btn-pixel rounded-[10px] bg-brand px-7 py-3.5 font-mono text-base font-bold text-gray-2">
              <Roll label="Request access" />
            </Link>
            <Link href="/login" className="font-mono text-base font-bold text-white underline decoration-white/40 decoration-2 underline-offset-[6px] hover:decoration-brand">
              Log in
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[13px] text-white/80">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 text-brand">
                  <path d="M2.5 8.5 6.5 12 13.5 4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="square" />
                </svg>
                {c}
              </li>
            ))}
          </ul>
        </div>
        <LevelCard rounds={rounds} />
      </div>

      <div className="flex items-center border-t border-white/10">
        <p className="shrink-0 py-5 pl-4 pr-6 font-mono text-[11px] uppercase tracking-[0.14em] text-white/60 sm:pl-6 md:py-7 md:pl-10 md:pr-10 md:text-xs xl:pl-[max(2.5rem,calc((100vw-1240px)/2+2.5rem))]">
          Markets on the board
        </p>
        <div className="lv-marquee min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="flex w-max animate-ticker gap-10 [animation-direction:reverse] will-change-transform md:gap-14">
            {[...ticker, ...ticker].map((t, i) => (
              <span key={`${t.sym}-${i}`} aria-hidden={i >= ticker.length || undefined} className="flex items-baseline gap-2 whitespace-nowrap font-mono text-sm tabular-nums md:text-base">
                <span className="font-bold text-white">{t.sym}</span>
                <span className="text-white/70">{t.val}</span>
                <span className={t.dir === "up" ? "text-up" : "text-down"}>{t.chg}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
