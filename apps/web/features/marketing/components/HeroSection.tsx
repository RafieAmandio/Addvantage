"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TickerRow } from "@/features/marketing/lib/landing";
import { ScrambleReveal } from "@/features/marketing/components/ScrambleReveal";
import { TickerItem } from "@/features/marketing/components/TickerItem";
import { HeroFilter } from "@/features/marketing/components/HeroFilter";

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

/** Stripe-style live number: Jakarta time to the millisecond, written straight to the DOM each frame. */
function LiveClock() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    let raf = 0;
    let t: ReturnType<typeof setInterval> | undefined;
    const write = () => {
      const now = Date.now();
      el.textContent = calm ? fmt.format(now) : `${fmt.format(now)}.${String(now % 1000).padStart(3, "0")}`;
    };
    if (calm) {
      write();
      t = setInterval(write, 1000);
    } else {
      const loop = () => {
        write();
        raf = requestAnimationFrame(loop);
      };
      loop();
    }
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(t);
    };
  }, []);
  return (
    <span ref={ref} className="tabular-nums" suppressHydrationWarning>
      --:--:--
    </span>
  );
}

export function HeroSection({ ticker, asOf }: { ticker: TickerRow[]; asOf: string }) {
  return (
    <section className="relative z-10 flex min-h-[100svh] flex-col overflow-hidden bg-gray">
      <div className="mx-auto grid w-full max-w-[1240px] flex-1 items-center gap-10 px-4 pb-10 pt-[104px] sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] md:gap-14 md:px-10 md:pt-[132px]">
        <div className="flex flex-col gap-7 md:gap-8">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-white/70 md:text-xs">
            <span className="flex items-center gap-2 text-white">
              <span className="lv-live inline-block h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              Jakarta <LiveClock /> WIB
            </span>
            <span aria-hidden className="hidden text-white/30 sm:inline">/</span>
            <span>{ticker.length} markets on the board</span>
          </p>
          <h1 className="font-sans text-[clamp(2.5rem,4.9vw,4.4rem)] font-bold leading-[0.98] tracking-[-0.03em] text-white [text-wrap:balance]">
            <span className="block font-normal">
              <ScrambleReveal text="Most news is noise." delay={150} duration={900} />
            </span>
            <span className="block">
              <Flicker minWait={3000} maxWait={7000}>
                <ScrambleReveal text="We read it so you don't" delay={450} duration={1000} />
              </Flicker>
              <Flicker className="text-brand" minWait={2000} maxWait={4000}>
                .
              </Flicker>
            </span>
          </h1>
          <p className="max-w-[52ch] font-mono text-sm leading-[1.55] text-white md:text-base">
            Directional Outlook &amp; Macro Alpha Intelligence, a market radar powered by AI and professionals, built for experienced traders.
          </p>
          <div className="flex w-full max-w-[520px] flex-col gap-3 sm:flex-row sm:gap-5">
            <Link href="/signup" className="btn-pixel flex-1 rounded-[10px] bg-brand px-8 py-4 text-center font-mono text-base font-bold text-gray-2">
              <Roll label="Request access" />
            </Link>
            <Link href="/login" className="btn-pixel flex-1 rounded-[10px] border border-brand bg-black/80 px-8 py-4 text-center font-mono text-base font-bold text-brand">
              <Roll label="Log in" />
            </Link>
          </div>
        </div>
        <HeroFilter ticker={ticker} />
      </div>

      <div className="border-t border-white/10 pb-6 pt-4 md:pb-8">
        <p className="mb-3 px-4 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-white/60 md:text-xs">Last close {asOf}. Real candles, read by the app itself.</p>
        <div className="lv-marquee overflow-hidden">
          <div className="flex w-max animate-ticker gap-4 [animation-direction:reverse] will-change-transform md:gap-[40px]">
            {[...ticker, ...ticker].map((t, i) => (
              <TickerItem key={`${t.sym}-${i}`} {...t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
