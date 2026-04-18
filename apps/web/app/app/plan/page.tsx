import Link from "next/link";
import { listPublishedPlans } from "@/features/plan/queries/plans";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { PlanDetail } from "@/features/plan/components/PlanDetail";

export default async function PlanPage() {
  const [latest] = await listPublishedPlans({ limit: 1 });

  if (!latest) {
    return (
      <div className="bg-grid-fine">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="border border-ink-3 bg-ink-2/30 p-8 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
              TRADING PLAN
            </div>
            <h1 className="mt-3 font-display text-2xl text-paper">
              No published plan yet.
            </h1>
            <p className="mt-2 text-sm text-paper/60">
              The desk hasn&apos;t published a plan for this cycle. Check back
              soon.
            </p>
            <Link
              href="/app/plan/archive"
              className="mt-6 inline-block border border-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
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
    <PlanDetail
      plan={plan}
      isLatest
      headerExtra={
        <Link
          href="/app/plan/archive"
          className="border border-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
        >
          View archive →
        </Link>
      }
    />
  );
}
