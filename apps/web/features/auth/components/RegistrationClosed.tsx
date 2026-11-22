import Link from "next/link";
import "@/features/marketing/landing.css";
import { tvFonts } from "@/features/marketing/lib/fonts";
import { GRAIN_URL } from "@/features/marketing/components/iso/Iso";
import { Roll } from "@/features/marketing/components/Roll";
import { DoorMark } from "./AccessScene";

// Public sign-up is invite-only for now: early access is the only way in.
// Shown at /signup when NEXT_PUBLIC_REGISTRATION_OPEN !== "1".
// One centred column on Paper, the glowing door above the ask (Whop's waitlist layout).
export function RegistrationClosed() {
  return (
    <main
      style={{ ["--tv-grain" as string]: `url("${GRAIN_URL}")` }}
      className={`tv-landing tv-grain relative isolate flex min-h-svh flex-col bg-tv-paper px-4 pb-10 pt-4 text-tv-ink sm:px-6 md:px-12 md:pt-6 ${tvFonts}`}
    >
      <header className="flex h-10 items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="TradeVantage home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/lockup-paper.svg" alt="+ vantage" width={319} height={73} className="h-[26px] w-auto md:h-[30px]" />
        </Link>
        <Link href="/" className="tv-link py-1 text-[15px] text-tv-graphite hover:text-tv-ink">
          <span aria-hidden>←</span> Back to the site
        </Link>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <DoorMark className="w-[220px] md:w-[280px]" />
        <h1 className="lv-in mt-6 text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.035em] [--i:1]">Want early access?</h1>
        <p className="lv-in mt-3 text-[16px] text-tv-graphite [--i:2]">We read every application.</p>
        <Link href="/early-access" className="tv-btn tv-btn-ink lv-in mt-8 [--i:3]">
          <Roll label="Apply for access" />
          <span aria-hidden className="tv-arrow">→</span>
        </Link>
        <p className="lv-in mt-6 text-[15px] text-tv-graphite [--i:4]">
          Have an account?{" "}
          <Link href="/login" className="tv-link font-medium text-tv-ink">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
