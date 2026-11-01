"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TickerRow } from "@/features/marketing/lib/landing";
import { ScrambleReveal } from "@/features/marketing/components/ScrambleReveal";
import { TickerItem } from "@/features/marketing/components/TickerItem";

/** Drops to near black now and then, like a sign with a loose wire. */
function Flicker({ children, className, minWait = 2000, maxWait = 4000 }: { children: React.ReactNode; className?: string; minWait?: number; maxWait?: number }) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;
    let id: ReturnType<typeof setInterval>;
    const schedule = () => {
      timeout = setTimeout(() => {
        const flickers = 2 + Math.floor(Math.random() * 3);
        let i = 0;
        id = setInterval(() => {
          if (cancelled) return clearInterval(id);
          setOpacity(i % 2 === 0 ? 0.1 + Math.random() * 0.3 : 1);
          if (++i >= flickers * 2) {
            clearInterval(id);
            setOpacity(1);
            schedule();
          }
        }, 40 + Math.random() * 60);
      }, minWait + Math.random() * (maxWait - minWait));
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      clearInterval(id);
    };
  }, [minWait, maxWait]);

  return (
    <span className={className} style={{ opacity }}>
      {children}
    </span>
  );
}

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

// The globe in hero.png sits 3.92% left of the image's horizontal center
// (measured from its apex). Nudge it right so it reads as centered.
const EARTH_X = "3.92%";

export function HeroSection({ ticker, asOf }: { ticker: TickerRow[]; asOf: string }) {
  const earthRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (earthRef.current && y < window.innerHeight * 1.5) {
          const zoom = 1 + Math.min(1, y / window.innerHeight) * 0.4;
          earthRef.current.style.transform = `translate(${EARTH_X}, ${y * 0.08}px) scale(${zoom})`;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Fixed behind the page: the rest of the site slides up over the globe. */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-gray">
        <div className="relative z-10 mx-auto flex max-w-[1100px] flex-col items-center gap-8 px-4 pt-[112px] text-center sm:px-6 md:gap-10 md:pt-[150px]">
          <h1 className="font-sans leading-[0.95] tracking-[-0.03em] text-white [text-wrap:balance]">
            <span className="block text-[clamp(2.6rem,10vw,120px)] font-normal">
              <ScrambleReveal text="WELCOME TO" delay={150} duration={900} />
            </span>
            <span className="block text-[clamp(2.6rem,10vw,120px)] font-bold">
              <Flicker minWait={3000} maxWait={7000}>
                <ScrambleReveal text="TRADEVANTAGE" delay={450} duration={900} />
              </Flicker>
              <Flicker className="text-brand" minWait={2000} maxWait={4000}>
                .
              </Flicker>
            </span>
          </h1>
          <p className="max-w-[58ch] font-mono text-sm leading-[1.5] text-white md:text-base">
            Directional Outlook &amp; Macro Alpha Intelligence, a market radar powered by AI and professionals, built for experienced traders.
          </p>
          <div className="flex w-full max-w-[560px] flex-col gap-3 sm:flex-row sm:gap-5">
            <Link href="/signup" className="btn-pixel flex-1 rounded-[10px] bg-brand px-8 py-4 text-center font-mono text-base font-bold text-gray-2">
              <Roll label="Request access" />
            </Link>
            <Link href="/login" className="btn-pixel flex-1 rounded-[10px] border border-brand bg-black/80 px-8 py-4 text-center font-mono text-base font-bold text-brand">
              <Roll label="Log in" />
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={earthRef}
            src="/figma/hero.png"
            alt=""
            fetchPriority="high"
            style={{ transform: `translateX(${EARTH_X})` }}
            className="absolute inset-x-0 bottom-[-48px] w-full min-w-[1080px] max-w-none origin-bottom select-none will-change-transform max-md:left-[calc(50%-540px)]"
          />
          <div className="absolute inset-x-0 bottom-0 h-[220px] bg-gradient-to-t from-gray via-gray/60 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 pb-8 md:pb-12">
          <p className="mb-3 px-4 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-white/70 md:text-xs">
            <span className="lv-live mr-2 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-brand align-middle" aria-hidden />
            Last close {asOf}. Real candles, read by the app itself.
          </p>
          <div className="lv-marquee overflow-hidden">
            <div className="flex w-max animate-ticker gap-4 [animation-direction:reverse] will-change-transform md:gap-[40px]">
              {[...ticker, ...ticker].map((t, i) => (
                <TickerItem key={`${t.sym}-${i}`} {...t} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer: pushes content below the hero viewport */}
      <div className="h-[100svh]" />
    </>
  );
}
