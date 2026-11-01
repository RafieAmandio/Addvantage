import type { Metadata } from "next";
import { listApprovedNews } from "@/features/news/queries/news";
import { listPublishedPlans } from "@/features/plan/queries/plans";
import { getPredictionHistory, listPredictions } from "@/features/predictions/queries/predictions";
import { listBulletins } from "@/features/bulletin/queries/bulletins";
import { listTimelineEvents } from "@/features/timeline/queries/timeline";
import { timelineEventToCalendarEvent } from "@/features/calendar/lib/fromTimeline";
import { apiGet } from "@/lib/api/client-server";
import { getProfile } from "@/lib/auth/session";
import type { AtrScannerData } from "@/features/atr/types";
import type { PriceHistoryPoint } from "@/features/predictions/types";
import type { ConsensusMarket } from "@/features/dashboard/components/ConsensusHero";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Thin history to about 300 points for a 1000px chart; keep the last point exact. */
function thin(points: PriceHistoryPoint[]) {
  const step = Math.max(1, Math.floor(points.length / 300));
  return points.filter((_, i) => i % step === 0 || i === points.length - 1);
}

export default async function HomePage() {
  const profile = await getProfile();
  // Bulletin is VIP/admin-only, so non-eligible members never fetch it.
  const canSeeBulletin = !!profile && (profile.tier === "vip" || profile.isAdmin);
  const now = Date.now();

  const [news, plans, predictions, bulletins, atr, macro] = await Promise.all([
    listApprovedNews(),
    listPublishedPlans({ limit: 20 }),
    listPredictions().catch((err) => {
      console.error("[predictions] query failed:", err);
      return [];
    }),
    canSeeBulletin ? listBulletins() : Promise.resolve([]),
    apiGet<AtrScannerData>("/atr/scanner").catch(() => ({ updatedAt: null, pairs: [] }) as AtrScannerData),
    listTimelineEvents({
      kinds: ["macro"],
      from: new Date(now - 2 * 3600_000).toISOString(),
      to: new Date(now + 48 * 3600_000).toISOString(),
      limit: 200,
    }).catch(() => []),
  ]);

  // Live markets first; history for the top two outcomes of each.
  const ordered = [...predictions].sort((a, b) => Number(a.stale) - Number(b.stale));
  const consensus: ConsensusMarket[] = await Promise.all(
    ordered.map(async (card) => ({
      card,
      series: await Promise.all(
        card.outcomes
          .slice(0, 2)
          .filter((o) => o.tokenId)
          .map(async (o) => ({ label: o.label, points: thin(await getPredictionHistory(o.tokenId!)) })),
      ),
    })),
  );

  const calendar = macro
    .map(timelineEventToCalendarEvent)
    .filter((e) => e.impact !== "low" && new Date(e.ts).getTime() >= now - 2 * 3600_000)
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .slice(0, 6);

  return (
    <DashboardClient
      news={news}
      plans={plans}
      bulletins={bulletins}
      consensus={consensus}
      atr={atr}
      calendar={calendar}
    />
  );
}
