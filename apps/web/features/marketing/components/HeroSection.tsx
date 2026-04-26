import Link from "next/link";
import { cn } from "@/lib/cn";
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
      <div className="relative h-[min(1024px,92vh)] min-h-[820px] overflow-hidden rounded-[32px] bg-gray">
        <div className="relative z-20 flex items-center justify-between px-6 py-8 md:px-[140px] md:py-[50px]">
          <Link href="/" className="flex items-center gap-[7.78px]">
            <LogoMark size={30} />
            <Wordmark size={24} />
          </Link>
          <Link
            href="/signup"
            className="rounded-[10px] bg-brand px-4 py-2 font-mono text-base font-bold text-black transition-colors hover:bg-brand-dim"
          >
            Join Now!
          </Link>
        </div>

        <div className="relative z-20 mx-auto flex max-w-[1100px] flex-col items-center gap-12 px-6 pt-8 text-center md:pt-[80px]">
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
              className="flex-1 rounded-[10px] bg-brand px-8 py-4 text-center font-mono text-base font-bold text-gray-2 transition-colors hover:bg-brand-dim"
            >
              Request Access
            </Link>
            <Link
              href="/login"
              className="flex-1 rounded-[10px] border border-brand bg-black/80 px-8 py-4 text-center font-mono text-base font-bold text-brand backdrop-blur-[9.4px] transition-colors hover:bg-black"
            >
              Operator Login
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/figma/earth-1.png"
            alt=""
            className="absolute left-1/2 top-[30%] w-[2600px] max-w-none -translate-x-1/2 select-none"
          />
          <div className="absolute inset-x-0 bottom-0 h-[220px] bg-gradient-to-t from-gray via-gray/60 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 overflow-hidden py-[50px]">
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
    </section>
  );
}
