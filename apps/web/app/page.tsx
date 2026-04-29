import { AccessSection } from "@/features/marketing/components/AccessSection";
import { FaqSection } from "@/features/marketing/components/FaqSection";
import { HeroSection } from "@/features/marketing/components/HeroSection";
import { MarketingFooter } from "@/features/marketing/components/MarketingFooter";
import { PositioningSection } from "@/features/marketing/components/PositioningSection";
import { TransmissionsSection } from "@/features/marketing/components/TransmissionsSection";
import { ConsoleEasterEgg } from "@/features/marketing/components/ConsoleEasterEgg";

export default function LandingPage() {
  return (
    <main className="min-h-screen cursor-crosshair bg-black text-white">
      <ConsoleEasterEgg />
      <HeroSection />
      <div className="relative z-10 bg-black">
        <PositioningSection />
        <TransmissionsSection />
        <FaqSection />
        <AccessSection />
        <MarketingFooter />
      </div>
    </main>
  );
}
