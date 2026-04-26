import { listApprovedNews } from "@/features/news/queries/news";
import { listPublishedPlans } from "@/features/plan/queries/plans";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { BriefClient } from "./BriefClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BriefPage() {
  const [news, plans] = await Promise.all([
    listApprovedNews(),
    listPublishedPlans({ limit: 1 }),
  ]);
  const latestPlan = plans[0] ? dbPlanToTradingPlan(plans[0]) : null;
  return <BriefClient news={news} plan={latestPlan} />;
}
