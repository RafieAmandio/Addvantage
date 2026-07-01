"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  LogoMark,
  Wordmark,
} from "@/features/marketing/components/icons";
import { heroTicker } from "@/features/marketing/lib/data";
import { ScrambleReveal } from "@/features/marketing/components/ScrambleReveal";
import { TickerItem } from "@/features/marketing/components/TickerItem";

function Flicker({
  children,
  className,
  minWait = 2000,
  maxWait = 4000,
}: {
  children: React.ReactNode;
  className?: string;
  minWait?: number;
  maxWait?: number;
}) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    let cancelled = false;
    function scheduleFlicker() {
      const wait = minWait + Math.random() * (maxWait - minWait);
      const timeout = setTimeout(() => {
        if (cancelled) return;
        const flickers = 2 + Math.floor(Math.random() * 3);
        let i = 0;
        const id = setInterval(() => {
          if (cancelled) { clearInterval(id); return; }
          setOpacity(i % 2 === 0 ? 0.1 + Math.random() * 0.3 : 1);
          i++;
          if (i >= flickers * 2) {
            clearInterval(id);
            setOpacity(1);
            scheduleFlicker();
          }
        }, 40 + Math.random() * 60);
      }, wait);
      return timeout;
    }
    const t = scheduleFlicker();
    return () => { cancelled = true; clearTimeout(t); };
  }, [minWait, maxWait]);

  return (
    <span className={className} style={{ opacity }}>
      {children}
    </span>
  );
}

export function HeroSection() {
  const earthRef = useRef<HTMLImageElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        if (earthRef.current) {
          const zoom = 1 + Math.min(1, scrolled / window.innerHeight) * 0.4;
          earthRef.current.style.transform = `translate(-50%, ${scrolled * 0.08}px) scale(${zoom})`;
        }
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Navbar — always on top */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-8 md:px-[140px] md:py-10">
        <Link href="/" className="group flex items-center gap-[7.78px]">
          <span className="transition-transform duration-300 ease-out group-hover:scale-110">
            <LogoMark size={30} />
          </span>
          <Wordmark size={24} />
        </Link>
        <Link
          href="/signup"
          className="btn-pixel rounded-[10px] bg-brand px-4 py-2 font-mono text-base font-bold text-black"
        >
          Join Now!
        </Link>
      </nav>

      {/* Hero — fixed behind everything */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-gray">
        <div className="relative z-10 mx-auto flex max-w-[1100px] flex-col items-center gap-12 px-6 pt-[120px] text-center md:pt-[160px]">
          <h1 className="font-sans leading-none text-white">
            <span
              className={cn(
                "block text-[clamp(3rem,10vw,128px)] font-normal transition-all duration-700",
                entered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
            >
              <ScrambleReveal text="WELCOME TO" delay={200} duration={900} />
            </span>
            <span
              className={cn(
                "block text-[clamp(3rem,10vw,128px)] font-bold transition-all duration-700 delay-300",
                entered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
            >
              <Flicker minWait={3000} maxWait={7000}>
                <ScrambleReveal text="TRADEVANTAGE" delay={500} duration={900} />
              </Flicker>
              <Flicker className="text-brand" minWait={2000} maxWait={4000}>.</Flicker>
            </span>
          </h1>
          <p
            className={cn(
              "max-w-2xl font-mono text-base leading-[1.4] text-white transition-all duration-700 delay-700",
              entered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
          >
            Directional Outlook &amp; Macro Alpha Intelligence — a market
            radar powered by AI and professionals, built for traders who
            already know what they&apos;re doing.
          </p>
          <div
            className={cn(
              "flex w-full max-w-[675px] flex-col gap-4 transition-all duration-700 delay-[900ms] sm:flex-row sm:gap-6",
              entered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            )}
          >
            <Link
              href="/signup"
              className="btn-pixel flex-1 rounded-[10px] bg-brand px-8 py-4 text-center font-mono text-base font-bold text-gray-2"
            >
              Request Access
            </Link>
            <Link
              href="/login"
              className="btn-pixel flex-1 rounded-[10px] border border-brand bg-black/80 px-8 py-4 text-center font-mono text-base font-bold text-brand backdrop-blur-[9.4px]"
            >
              Operator Login
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={earthRef}
            src="/figma/earth-1.png"
            alt=""
            className="absolute left-1/2 top-[2%] w-[5000px] max-w-none -translate-x-1/2 select-none will-change-transform"
          />
          <div className="absolute inset-x-0 bottom-0 h-[220px] bg-gradient-to-t from-gray via-gray/60 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 overflow-hidden py-[50px]">
          <div className="flex w-max animate-ticker gap-[50px] [animation-direction:reverse] will-change-transform">
            {[...heroTicker, ...heroTicker].map((t, i) => (
              <TickerItem key={`${t.sym}-${i}`} {...t} />
            ))}
          </div>
        </div>
      </div>

      {/* Spacer — pushes content below the hero viewport */}
      <div className="h-screen" />
    </>
  );
}
