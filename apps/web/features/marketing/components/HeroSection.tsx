"use client";

import Link from "next/link";
import { HeroStreaks } from "@/features/marketing/components/HeroStreaks";

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

/** Slim floating pill bar, Raycast style. */
export function MarketingNav() {
  return (
    <header className="lv-header fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-4">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between rounded-2xl border border-white/10 bg-[#0c0c0c]/80 px-4 backdrop-blur-xl md:h-[64px] md:px-6">
        <Link href="/" className="flex items-center" aria-label="+vantage home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-vantage.png" alt="+vantage" width={319} height={73} className="h-6 w-auto md:h-7" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/65 md:flex">
          {LINKS.map(([l, h]) => (
            <a key={l} href={h} className="transition-colors hover:text-white">
              {l}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 md:gap-5">
          <Link href="/login" className="text-sm text-white/65 transition-colors hover:text-white">
            Log in
          </Link>
          <Link href="/signup" className="rounded-lg bg-[#E6E6E6] px-3 py-1.5 text-sm font-medium text-black shadow-[0_0_0_2px_rgba(0,0,0,.5),0_0_14px_rgba(255,255,255,.19),inset_0_-1px_.4px_rgba(0,0,0,.2),inset_0_1px_.4px_#fff] transition-colors hover:bg-white">
            Request access
          </Link>
        </div>
      </div>
    </header>
  );
}

export function HeroSection() {
  return (
    <section className="relative z-10 flex min-h-[100svh] flex-col items-center overflow-hidden bg-[#050505] px-4 text-center">
      <HeroStreaks className="absolute inset-0 h-full w-full" />
      <div className="relative flex flex-1 flex-col items-center justify-center pt-24">
        <h1 className="text-[clamp(2.6rem,5.6vw,4.5rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,.55)]">
          Read the market.
          <br />
          Not the noise<span className="text-brand">.</span>
        </h1>
        <p className="mt-6 max-w-[34rem] text-base leading-[1.45] text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,.8)] md:text-lg">
          Directional outlook and macro alpha intelligence. A market radar powered by AI and professionals, built for experienced traders.
        </p>
      </div>
      <div className="relative flex flex-col items-center gap-3 pb-10 pt-10 md:pb-14">
        <Link
          href="/signup"
          className="rounded-lg bg-[#E6E6E6] px-4 py-2.5 text-sm font-medium text-black shadow-[0_0_0_2px_rgba(0,0,0,.5),0_0_14px_rgba(255,255,255,.19),inset_0_-1px_.4px_rgba(0,0,0,.2),inset_0_1px_.4px_#fff] transition-colors hover:bg-white"
        >
          Request access
        </Link>
        <p className="mt-2 font-mono text-xs leading-[2] text-white/50">
          Free tier, no card · 2% max risk built in
          <br />
          No signals to copy ·{" "}
          <Link href="/login" className="text-white/80 underline-offset-4 hover:text-white hover:underline">
            Log in
          </Link>
        </p>
        <a href="#method" className="mt-5 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-white/85 backdrop-blur transition-colors hover:border-white/30 hover:text-white">
          See the lab <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}
