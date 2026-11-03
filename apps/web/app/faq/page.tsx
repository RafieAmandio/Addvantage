import type { Metadata, Viewport } from "next";
import "@/features/marketing/landing.css";
import { FaqSection } from "@/features/marketing/components/FaqSection";
import { MarketingNav } from "@/features/marketing/components/HeroSection";
import { LandingMotion } from "@/features/marketing/components/LandingMotion";
import { MarketingFooter } from "@/features/marketing/components/MarketingFooter";
import { tvFonts } from "@/features/marketing/lib/fonts";

const description = "Why TradeVantage has no Discord and no chat room: noise, moderation, emotional contagion, and your privacy.";

export const metadata: Metadata = {
  title: { absolute: "FAQ | TradeVantage" },
  description,
  openGraph: { title: "FAQ | TradeVantage", description, type: "website", siteName: "TradeVantage" },
};

export const viewport: Viewport = { themeColor: "#F4F3EF" };

export default function FaqPage() {
  return (
    <main id="top" className={`tv-landing min-h-screen cursor-crosshair bg-tv-paper text-tv-ink ${tvFonts}`}>
      <noscript>
        <style>{".tv-figure [data-build]{opacity:1!important}.tv-figure [data-cue]{opacity:1!important;translate:none!important}.tv-leader{stroke-dashoffset:0!important}.tv-dot{opacity:1!important}"}</style>
      </noscript>
      <LandingMotion />
      <MarketingNav home="/" />
      <FaqSection />
      <MarketingFooter />
    </main>
  );
}
