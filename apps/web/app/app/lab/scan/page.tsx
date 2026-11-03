import type { Metadata } from "next";
import { FOREX_PAIRS } from "@tradevantage/shared";
import { getBoard } from "@/features/method/queries";
import { ScanRunner } from "@/features/method/components/ScanRunner";
import { LabComingSoon } from "@/features/method/components/LabComingSoon";
import { isMockMode } from "@/lib/config/public";

export const metadata: Metadata = { title: "Morning scan" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

// The routine covers the core list: primary and secondary markets, in that order.
const CORE = FOREX_PAIRS.filter((p) => p.tier !== "thirdliner").map((p) => p.symbol);

export default async function ScanPage() {
  // ponytail: Morning Scan is demo-only until it ships; drop this line to open it in production.
  if (!isMockMode()) return <LabComingSoon tool="scan" />;
  const rows = (await getBoard()).filter((r) => CORE.includes(r.symbol)).sort((a, b) => CORE.indexOf(a.symbol) - CORE.indexOf(b.symbol));
  // The trader's WIB date: the plan belongs to the trading day that starts after this close.
  const date = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <p className="max-w-2xl text-[14px] leading-[21px] text-white/55">
        Run this after the daily close. For each market, read the last candle yourself first, then see what the candles say. Rate how clear it is and finish with a ranked plan.
      </p>
      <ScanRunner rows={rows} date={date} />
    </div>
  );
}
