"use client";

import Link from "next/link";
import { HeroDots } from "@/features/marketing/components/HeroDots";

/** A button label that rolls up on hover. */
export function Roll({ label }: { label: string }) {
  return (
    <span className="lv-roll" data-label={label}>
      <span>{label}</span>
    </span>
  );
}

const LINKS = [
  ["Lab", "#method"],
  ["Journal", "#train"],
  ["Access", "#access"],
  ["FAQ", "#faq"],
];

/** Slim floating pill bar, Raycast's shape in our type. */
export function MarketingNav() {
  return (
    <header className="lv-header fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-4">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between rounded-2xl border border-white/10 bg-[#0a0a0a]/80 px-4 backdrop-blur-xl md:h-[64px] md:px-6">
        <Link href="/" className="flex items-center" aria-label="+vantage home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-vantage.png" alt="+vantage" width={319} height={73} className="h-6 w-auto md:h-7" />
        </Link>
        <nav className="hidden items-center gap-8 font-mono text-sm text-white/60 md:flex">
          {LINKS.map(([l, h]) => (
            <a key={l} href={h} className="transition-colors hover:text-brand">
              {l}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 md:gap-5">
          <Link href="/login" className="font-mono text-sm font-bold text-white hover:text-brand">
            <Roll label="Log in" />
          </Link>
          <Link href="/signup" className="btn-pixel rounded-[8px] bg-brand px-3 py-1.5 font-mono text-sm font-bold text-black">
            <Roll label="Request access" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function HeroSection() {
  return (
    <section className="relative z-10 flex min-h-[100svh] flex-col items-center overflow-hidden bg-black px-4 text-center">
      <HeroDots className="absolute inset-0 h-full w-full" />
      <div className="relative flex flex-1 flex-col items-center justify-center pt-24">
        <h1 className="font-sans text-[clamp(2.2rem,7vw,6.25rem)] uppercase leading-[0.98] tracking-[-0.02em] text-white [text-shadow:0_2px_18px_rgba(0,0,0,.45)]">
          <span className="block font-normal">Read the market.</span>
          <span className="block font-bold">
            Not the noise<span className="text-brand">.</span>
          </span>
        </h1>
        <p className="relative isolate mt-7 max-w-[44rem] font-mono text-[13px] leading-[1.6] text-white [text-shadow:0_0_4px_#000] md:text-base">
          <span aria-hidden className="absolute -inset-x-10 -inset-y-6 -z-10 bg-[radial-gradient(closest-side,rgba(0,0,0,.92)_55%,transparent)]" />
          Directional outlook and macro alpha intelligence. A market radar powered by AI and professionals, built for experienced traders.
        </p>
      </div>
      <div className="relative flex w-full flex-col items-center gap-5 pb-10 pt-10 md:pb-14">
        <div className="flex w-full max-w-[460px] flex-col gap-3 sm:flex-row sm:gap-5">
          <Link href="/signup" className="btn-pixel flex-1 rounded-[10px] bg-brand px-6 py-4 text-center font-mono text-base font-bold text-gray-2">
            <Roll label="Request access" />
          </Link>
          <Link href="/login" className="btn-pixel flex-1 rounded-[10px] border border-brand bg-black/80 px-6 py-4 text-center font-mono text-base font-bold text-brand">
            <Roll label="Log in" />
          </Link>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/50">
          Free tier, no card · 2% max risk built in<span className="hidden sm:inline"> · </span>
          <br className="sm:hidden" />
          No signals to copy
        </p>
        <a href="#method" className="mt-1 rounded-full border border-white/20 px-4 py-2 font-mono text-xs text-white/80 transition-colors hover:border-brand hover:text-brand">
          See the lab <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}
