import type { Metadata } from "next";
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

// The root layout's title carries a dash, so the public page states its own.
export const metadata: Metadata = {
  title: { absolute: "+Vantage | Read the market yourself" },
  description,
  openGraph: { title: "+Vantage | Read the market yourself", description, type: "website" },
};

export default function LandingPage() {
  const d = landingData();
  return (
    <main id="top" className="min-h-screen cursor-crosshair bg-black text-white">
      <ConsoleEasterEgg />
      <LandingMotion />
      <MarketingNav />
      <HeroSection />
      <BoardStrip board={d.board} asOf={d.asOf} />
      <PositioningSection />
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
