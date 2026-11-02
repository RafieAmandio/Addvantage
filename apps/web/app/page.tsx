import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "@/features/marketing/landing.css";
import { AccessSection } from "@/features/marketing/components/AccessSection";
import { BoardStrip } from "@/features/marketing/components/BoardStrip";
import { CloseSection } from "@/features/marketing/components/CloseSection";
import { ConsoleEasterEgg } from "@/features/marketing/components/ConsoleEasterEgg";
import { FaqSection } from "@/features/marketing/components/FaqSection";
import { HeroSection, MarketingNav } from "@/features/marketing/components/HeroSection";
import { LandingMotion } from "@/features/marketing/components/LandingMotion";
import { MarketingFooter } from "@/features/marketing/components/MarketingFooter";
import { PositioningSection } from "@/features/marketing/components/PositioningSection";
import { TransmissionsSection } from "@/features/marketing/components/TransmissionsSection";
import { MethodSection } from "@/features/marketing/components/MethodSection";
import { TrainSection } from "@/features/marketing/components/TrainSection";
import { landingData } from "@/features/marketing/lib/landing";

const description =
  "Market intelligence for traders who read the chart themselves. Noise filtered, levels drawn, bad trades refused. No signals, no chat room.";

const sans = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-tv-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-tv-mono", display: "swap" });

// The root layout's title carries a dash, so the public page states its own.
export const metadata: Metadata = {
  title: { absolute: "TradeVantage | Read the market yourself" },
  description,
  openGraph: { title: "TradeVantage | Read the market yourself", description, type: "website", siteName: "TradeVantage" },
};

export const viewport: Viewport = { themeColor: "#F4F3EF" };

export default function LandingPage() {
  const d = landingData();
  return (
    <main id="top" className={`tv-landing min-h-screen cursor-crosshair bg-tv-paper text-tv-ink ${sans.variable} ${mono.variable}`}>
      {/* Without JS the isometric figures are simply built. */}
      <noscript>
        <style>{".tv-figure [data-build]{opacity:1!important}.tv-figure [data-cue]{opacity:1!important;translate:none!important}.tv-leader{stroke-dashoffset:0!important}.tv-dot{opacity:1!important}.tv-digit>span{transform:translateY(calc(var(--d)*-1.2em))!important}"}</style>
      </noscript>
      <ConsoleEasterEgg />
      <LandingMotion />
      <MarketingNav />
      <HeroSection hero={d.hero} />
      <BoardStrip board={d.board} asOf={d.asOf} />
      <PositioningSection markets={d.ticker} />
      <TransmissionsSection />
      <MethodSection read={d.read} plan={d.plan} />
      <TrainSection practice={d.practice} scan={d.scan} kill={d.kill} />
      <FaqSection />
      <AccessSection />
      <CloseSection />
      <MarketingFooter />
    </main>
  );
}
