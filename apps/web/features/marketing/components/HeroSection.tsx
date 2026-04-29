"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import {
  LogoMark,
  TriangleDown,
  TriangleUp,
  Wordmark,
} from "@/features/marketing/components/icons";
import { heroTicker } from "@/features/marketing/lib/data";

export function HeroSection() {
  const earthRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        if (earthRef.current) {
          earthRef.current.style.transform = `translate(-50%, ${scrolled * 0.08}px)`;
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
        <Link href="/" className="flex items-center gap-[7.78px]">
          <LogoMark size={30} />
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
            <span className="block text-[clamp(3rem,10vw,128px)] font-normal">
              WELCOME TO
            </span>
            <span className="block text-[clamp(3rem,10vw,128px)] font-bold">
              THE DOMAIN<span className="text-brand">.</span>
            </span>
          </h1>
          <p className="max-w-2xl font-mono text-base leading-[1.4] text-white">
            Directional Outlook &amp; Macro Alpha Intelligence — a market
            radar powered by AI and professionals, built for traders who
            already know what they&apos;re doing.
          </p>
          <div className="flex w-full max-w-[675px] gap-6">
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
              <div
                key={`${t.sym}-${i}`}
                className="flex w-[220px] shrink-0 items-center justify-center gap-[11px] rounded-[10px] bg-white/10 p-4 backdrop-blur-[8.65px]"
              >
                <span className="font-mono text-base font-bold text-white">
                  {t.sym}
                </span>
                <span className="font-mono text-base text-white">
                  {t.val}
                </span>
                {t.dir === "up" ? (
                  <TriangleUp className="h-[10px] w-[15px] text-brand" />
                ) : (
                  <TriangleDown className="h-[10px] w-[15px] text-blood-bright" />
                )}
                <span
                  className={cn(
                    "font-mono text-base",
                    t.dir === "up" ? "text-brand" : "text-blood-bright"
                  )}
                >
                  {t.chg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spacer — pushes content below the hero viewport */}
      <div className="h-screen" />
    </>
  );
}
