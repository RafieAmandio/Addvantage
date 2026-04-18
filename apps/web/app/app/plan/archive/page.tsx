import { listPublishedPlans } from "@/features/plan/queries/plans";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { PlanArchiveView } from "@/features/plan/components/PlanArchiveView";

export default async function PlanArchivePage() {
  const rows = await listPublishedPlans({ limit: 100 });
  const allPlans = rows.map(dbPlanToTradingPlan);
  const latest = allPlans[0] ?? null;
  return <PlanArchiveView allPlans={allPlans} latest={latest} />;
}
