import type { Metadata } from "next";
import { listApprovedNews } from "@/features/news/queries/news";

export const metadata: Metadata = { title: "Watchlist" };
import { listPublishedPlans } from "@/features/plan/queries/plans";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { apiGet } from "@/lib/api/client-server";
import type { AtrScannerData } from "@/features/atr/types";
import { WatchlistClient } from "./WatchlistClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WatchlistPage() {
  const [news, dbPlans, atr] = await Promise.all([
    listApprovedNews(),
    listPublishedPlans(),
    // Same price source as the Home watchlist; missing feed just hides prices.
    apiGet<AtrScannerData>("/atr/scanner").catch(() => ({ updatedAt: null, pairs: [] }) as AtrScannerData),
  ]);
  const plans = dbPlans.map(dbPlanToTradingPlan);
  return <WatchlistClient news={news} plans={plans} pairs={atr.pairs} />;
}
