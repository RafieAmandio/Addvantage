import Link from "next/link";
import { listPublishedPlans } from "@/features/plan/queries/plans";
import { getClosedPlanStats } from "@/features/plan/queries/stats";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { PlanDetail } from "@/features/plan/components/PlanDetail";
import { PlanStatsBadges } from "@/features/plan/components/PlanStatsBadges";

export default async function PlanPage() {
  const [plans, stats] = await Promise.all([
    listPublishedPlans({ limit: 1 }),
    getClosedPlanStats(),
  ]);
  const latest = plans[0];

  if (!latest) {
    return (
      <div className="bg-grid-fine">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <PlanStatsBadges stats={stats} />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6">
          <div className="border border-gray-3 bg-gray-2/30 p-8 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/50">
              TRADING PLAN
            </div>
            <h1 className="mt-3 font-display text-2xl text-white">
              No published plan yet.
            </h1>
            <p className="mt-2 text-sm text-white/60">
              The desk hasn&apos;t published a plan for this cycle. Check back
              soon.
            </p>
            <Link
              href="/app/plan/archive"
              className="mt-6 inline-block border border-gray-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60 hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              View archive →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const plan = dbPlanToTradingPlan(latest);

  return (
    <div className="bg-grid-fine">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <PlanStatsBadges stats={stats} />
      </div>
      <PlanDetail
        plan={plan}
        isLatest
        headerExtra={
          <Link
            href="/app/plan/archive"
            className="border border-gray-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60 hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            View archive →
          </Link>
        }
      />
    </div>
  );
}
