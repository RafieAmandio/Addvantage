import type { Metadata } from "next";
import { EarlyAccessWizard } from "@/features/early-access/components/EarlyAccessWizard";
import { EarlyAccessClosed } from "@/features/early-access/components/EarlyAccessClosed";

export const metadata: Metadata = {
  title: "Early Access",
  description:
    "Founding early-access intake for TradeVantage. Reserve your place, opt into the 100% cashback program, and secure your subscription.",
  robots: { index: false, follow: false },
};

// Hard gate: the intake flow only renders when enrollment is explicitly opened
// (NEXT_PUBLIC_EARLY_ACCESS_OPEN=1, baked at build time). Otherwise nobody can
// register — they get the standby screen.
const EARLY_ACCESS_OPEN = process.env.NEXT_PUBLIC_EARLY_ACCESS_OPEN === "1";

export default function EarlyAccessPage() {
  return EARLY_ACCESS_OPEN ? <EarlyAccessWizard /> : <EarlyAccessClosed />;
}
