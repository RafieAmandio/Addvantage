import { listApprovedNews } from "@/features/news/queries/news";
import { listPublishedPlans } from "@/features/plan/queries/plans";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { WatchlistClient } from "./WatchlistClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WatchlistPage() {
  const [news, dbPlans] = await Promise.all([
    listApprovedNews(),
    listPublishedPlans(),
  ]);
  const plans = dbPlans.map(dbPlanToTradingPlan);
  return <WatchlistClient news={news} plans={plans} />;
}
