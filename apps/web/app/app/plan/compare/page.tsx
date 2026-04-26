import type { Metadata } from "next";
import {
  getPlanById,
  listPublishedPlans,
} from "@/features/plan/queries/plans";

export const metadata: Metadata = { title: "Compare Plans" };
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { PlanCompareView } from "@/features/plan/components/PlanCompareView";

export default async function PlanComparePage({
  searchParams,
}: {
  searchParams?: { a?: string; b?: string };
}) {
  const a = searchParams?.a ?? null;
  const b = searchParams?.b ?? null;

  const [rows, rowA, rowB] = await Promise.all([
    listPublishedPlans({ limit: 50 }),
    a ? getPlanById(a) : Promise.resolve(null),
    b ? getPlanById(b) : Promise.resolve(null),
  ]);

  const allPlans = rows.map(dbPlanToTradingPlan);
  const latest = allPlans[0] ?? null;
  const planA =
    rowA && rowA.status === "published" ? dbPlanToTradingPlan(rowA) : null;
  const planB =
    rowB && rowB.status === "published" ? dbPlanToTradingPlan(rowB) : null;

  return (
    <PlanCompareView
      allPlans={allPlans}
      latest={latest}
      planA={planA}
      planB={planB}
    />
  );
}
