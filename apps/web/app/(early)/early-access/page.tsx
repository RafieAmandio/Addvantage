import type { Metadata } from "next";
import { EarlyAccessWizard } from "@/features/early-access/components/EarlyAccessWizard";
import { EarlyAccessClosed } from "@/features/early-access/components/EarlyAccessClosed";

export const metadata: Metadata = {
  title: "Early Access",
  description:
    "Founding early-access intake for TradeVantage. Reserve your place, opt into the 100% cashback program, and secure your subscription.",
  robots: { index: false, follow: false },
};

// Early access is the primary way in, so it's open by default. Set
// NEXT_PUBLIC_EARLY_ACCESS_OPEN=0 at build time to fall back to the standby
// screen (e.g. to pause intake).
const EARLY_ACCESS_OPEN = process.env.NEXT_PUBLIC_EARLY_ACCESS_OPEN !== "0";

export default function EarlyAccessPage() {
  return EARLY_ACCESS_OPEN ? <EarlyAccessWizard /> : <EarlyAccessClosed />;
}
