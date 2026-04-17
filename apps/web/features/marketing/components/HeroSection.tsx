import Link from "next/link";
import {
  LogoMark,
  TriangleDown,
  TriangleUp,
  Wordmark,
} from "@/features/marketing/components/icons";
import { heroTicker } from "@/features/marketing/lib/data";

export function HeroSection() {
  return (
    <section className="px-3 pt-3">
      <div className="relative h-[min(1024px,92vh)] min-h-[820px] overflow-hidden rounded-[32px] bg-[#1F1F1F]">
        {/* Top nav: Logo + Join */}
        <div className="relative z-20 flex items-center justify-between px-6 py-8 md:px-[140px] md:py-[50px]">
          <Link href="/" className="flex items-center gap-[7.78px]">
            <LogoMark size={30} />
            <Wordmark size={24} />
          </Link>
          <Link
            href="/signup"
            className="rounded-[10px] bg-lime px-4 py-2 font-mono text-base font-bold text-ink transition-colors hover:bg-lime-dim"
          >
            Join Now!
          </Link>
        </div>

        {/* Hero content — top-aligned */}
        <div className="relative z-20 mx-auto flex max-w-[1100px] flex-col items-center gap-12 px-6 pt-8 text-center md:pt-[80px]">
          <h1 className="font-sans leading-none text-paper">
            <span className="block text-[clamp(3rem,10vw,128px)] font-normal">
              WELCOME TO
            </span>
            <span className="block text-[clamp(3rem,10vw,128px)] font-bold">
              THE DOMAIN<span className="text-lime">.</span>
            </span>
          </h1>
          <p className="max-w-2xl font-mono text-base leading-[1.4] text-paper">
            Directional Outlook &amp; Macro Alpha Intelligence — a market
            radar powered by AI and professionals, built for traders who
            already know what they&apos;re doing.
          </p>
          <div className="flex w-full max-w-[675px] gap-6">
            <Link
              href="/signup"
              className="flex-1 rounded-[10px] bg-lime px-8 py-4 text-center font-mono text-base font-bold text-ink-2 transition-colors hover:bg-lime-dim"
            >
              Request Access
            </Link>
            <Link
              href="/login"
              className="flex-1 rounded-[10px] border border-lime bg-ink/80 px-8 py-4 text-center font-mono text-base font-bold text-lime backdrop-blur-[9.4px] transition-colors hover:bg-ink"
            >
              Operator Login
            </Link>
          </div>
        </div>

        {/* Earth backdrop — huge sphere rising from bottom, only top curve visible */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/figma/earth-1.png"
            alt=""
            className="absolute left-1/2 top-[30%] w-[2600px] max-w-none -translate-x-1/2 select-none"
          />
          {/* bottom fade so the ticker sits cleanly over the earth */}
          <div className="absolute inset-x-0 bottom-0 h-[220px] bg-gradient-to-t from-[#1F1F1F] via-[rgba(31,31,31,0.6)] to-transparent" />
        </div>

        {/* Bottom ticker — infinite marquee, left → right */}
        <div className="absolute inset-x-0 bottom-0 z-30 overflow-hidden py-[50px]">
          <div className="flex w-max animate-ticker gap-[50px] [animation-direction:reverse] will-change-transform">
            {[...heroTicker, ...heroTicker].map((t, i) => (
              <div
                key={`${t.sym}-${i}`}
                className="flex w-[220px] shrink-0 items-center justify-center gap-[11px] rounded-[10px] bg-white/10 p-4 backdrop-blur-[8.65px]"
              >
                <span className="font-mono text-base font-bold text-paper">
                  {t.sym}
                </span>
                <span className="font-mono text-base text-paper">
                  {t.val}
                </span>
                {t.dir === "up" ? (
                  <TriangleUp className="h-[10px] w-[15px] text-lime" />
                ) : (
                  <TriangleDown className="h-[10px] w-[15px] text-[#E03C3C]" />
                )}
                <span
                  className={
                    "font-mono text-base " +
                    (t.dir === "up" ? "text-lime" : "text-[#E03C3C]")
                  }
                >
                  {t.chg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
