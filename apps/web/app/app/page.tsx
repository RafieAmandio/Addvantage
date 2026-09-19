import type { Metadata } from "next";
import { listApprovedNews } from "@/features/news/queries/news";
import { listPublishedPlans } from "@/features/plan/queries/plans";
import { listPredictions } from "@/features/predictions/queries/predictions";
import { listBulletins } from "@/features/bulletin/queries/bulletins";
import { getProfile } from "@/lib/auth/session";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const profile = await getProfile();
  // Bulletin is VIP/admin-only, so non-eligible members never fetch it.
  const canSeeBulletin = !!profile && (profile.tier === "vip" || profile.isAdmin);

  const [news, plans, predictions, bulletins] = await Promise.all([
    listApprovedNews(),
    listPublishedPlans({ limit: 20 }),
    listPredictions().catch((err) => {
      console.error("[predictions] query failed:", err);
      return [];
    }),
    canSeeBulletin ? listBulletins() : Promise.resolve([]),
  ]);
  return (
    <DashboardClient
      news={news}
      plans={plans}
      predictions={predictions}
      bulletins={bulletins}
    />
  );
}
