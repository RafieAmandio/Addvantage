import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@/features/marketing/landing.css";
import "@/features/black-friday/black-friday.css";
import { LandingMotion } from "@/features/marketing/components/LandingMotion";
import { MarketingFooter } from "@/features/marketing/components/MarketingFooter";
import { tvFonts } from "@/features/marketing/lib/fonts";
import { BlackFridayWizard } from "@/features/black-friday/components/BlackFridayWizard";

const description =
  "Open a BingX account with code TRADEVANTAGE, then apply for a free TradeVantage account or a year of full access for $500.";

export const metadata: Metadata = {
  title: { absolute: "Black Friday | TradeVantage x BingX" },
  description,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#F4F3EF" };

// Always open: the promo runs until this route is removed.
export default function BlackFridayPage() {
  return (
    <main className={`tv-landing min-h-screen bg-tv-paper text-tv-ink ${tvFonts}`}>
      <noscript>
        <style>{".tv-figure [data-build]{opacity:1!important}.tv-leader{stroke-dashoffset:0!important}.tv-dot{opacity:1!important}"}</style>
      </noscript>
      <LandingMotion />
      <header className="absolute inset-x-0 top-0 z-10 px-4 md:px-8">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center md:h-[72px] md:px-2">
          <Link href="https://tradevantage.gg" className="flex items-center" aria-label="TradeVantage home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockup-paper.svg" alt="+ vantage" width={319} height={73} className="h-[26px] w-auto md:h-[30px]" />
          </Link>
        </div>
      </header>
      <BlackFridayWizard />
      <MarketingFooter snapshot={false} />
    </main>
  );
}
