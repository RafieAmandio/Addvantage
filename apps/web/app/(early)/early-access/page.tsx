import type { Metadata } from "next";
import { EarlyAccessWizard } from "@/features/early-access/components/EarlyAccessWizard";

export const metadata: Metadata = {
  title: "Early Access",
  description:
    "Founding early-access intake for TradeVantage. Reserve your place, opt into the 100% cashback program, and secure your subscription.",
  robots: { index: false, follow: false },
};

export default function EarlyAccessPage() {
  return <EarlyAccessWizard />;
}
