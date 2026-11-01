"use client";

import Link from "next/link";
import { useRef } from "react";
import { ScrambleReveal } from "@/features/marketing/components/ScrambleReveal";
import { useCursorGrid, cursorGrid } from "@/features/marketing/lib/use-cursor-grid";
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

const CHECKS = ["Free tier, no card", "2% max risk, built in", "No signals to copy"];


export function HeroSection({ ticker, rounds }: { ticker: TickerRow[]; rounds: LevelRound[] }) {
  const ref = useRef<HTMLElement>(null);
  const m = useCursorGrid(ref);
  return (
    <section ref={ref} className="relative z-10 flex min-h-[100svh] flex-col overflow-hidden bg-gray">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 transition-opacity duration-300" style={cursorGrid(m)} />
      <div className="relative mx-auto grid w-full max-w-[1240px] flex-1 items-center gap-12 px-4 pb-14 pt-[112px] sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-14 md:px-10 md:pt-[140px]">
        <div className="flex flex-col">
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-white/60 sm:tracking-[0.12em] md:text-sm">
            <span className="font-bold text-brand">+vantage</span> · market intelligence for traders
          </p>
          <h1 className="mt-5 font-sans text-[clamp(2.05rem,4.6vw,4.4rem)] uppercase leading-[1.06] tracking-[-0.02em] text-white [&>span]:whitespace-nowrap">
            <span className="block font-normal">Read the market.</span>
            <span className="block font-bold">
              Not the{" "}
              <span className="whitespace-pre bg-brand px-[0.08em] text-black">
                <ScrambleReveal text="NOISE" delay={500} duration={900} />
              </span>
              <span className="text-brand">.</span>
            </span>
          </h1>
          <p className="mt-7 max-w-[50ch] font-mono text-sm leading-[1.6] text-white md:text-base">
            Directional Outlook &amp; Macro Alpha Intelligence, a market radar powered by AI and professionals, built for experienced traders.
          </p>
          <hr className="my-8 max-w-[560px] border-white/20" />
          <div className="flex w-full max-w-[520px] flex-col gap-3 sm:flex-row sm:gap-5">
            <Link href="/signup" className="btn-pixel flex-1 rounded-[10px] bg-brand px-8 py-4 text-center font-mono text-base font-bold text-gray-2">
              <Roll label="Request access" />
            </Link>
            <Link href="/login" className="btn-pixel flex-1 rounded-[10px] border border-brand bg-black/80 px-8 py-4 text-center font-mono text-base font-bold text-brand">
              <Roll label="Log in" />
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.06em] text-white/80 md:text-[13px]">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-center gap-2.5">
                <span aria-hidden className="h-2 w-2 bg-brand" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <LevelCard rounds={rounds} />
      </div>

      <div className="relative flex items-center border-t border-white/20">
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
