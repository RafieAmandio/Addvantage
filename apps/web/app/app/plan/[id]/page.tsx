import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPlanById,
  listPublishedPlans,
} from "@/features/plan/queries/plans";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { PlanDetail } from "@/features/plan/components/PlanDetail";
import { PlanSiblingKeys } from "@/features/plan/components/PlanSiblingKeys";
import { NewsMentioningPlan } from "@/features/plan/components/NewsMentioningPlan";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default async function PlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [row, allRows] = await Promise.all([
    getPlanById(params.id),
    listPublishedPlans({ limit: 100 }),
  ]);

  if (!row || row.status !== "published") return notFound();

  const plan = dbPlanToTradingPlan(row);
  const all = allRows.map(dbPlanToTradingPlan);

  const latestId = all[0]?.id ?? plan.id;
  const isLatest = plan.id === latestId;
  const idx = all.findIndex((p) => p.id === plan.id);
  const newer = idx > 0 ? all[idx - 1] : null;
  const older = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  const firstId = all[0]?.id ?? plan.id;
  const lastId = all[all.length - 1]?.id ?? plan.id;

  return (
    <div>
      <PlanSiblingKeys
        newerId={newer?.id ?? null}
        olderId={older?.id ?? null}
        firstId={firstId}
        lastId={lastId}
      />
      <PlanDetail
        plan={plan}
        isLatest={isLatest}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Home", href: "/app" },
              { label: "Plan", href: "/app/plan" },
              { label: "Archive", href: "/app/plan/archive" },
              { label: plan.id },
            ]}
          />
        }
        headerExtra={
          <div className="flex gap-2">
            <Link
              href={`/app/plan/compare?a=${plan.id}`}
              title="Compare this plan with another"
              className="border border-gray-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              ⇌ COMPARE
            </Link>
            <Link
              href="/app/plan/archive"
              className="border border-gray-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              ← Archive
            </Link>
          </div>
        }
      />

      <NewsMentioningPlan planId={plan.id} />

      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-12">
        <nav className="grid grid-cols-2 gap-px border border-gray-3 bg-gray-3">
          <Link
            href={newer ? `/app/plan/${newer.id}` : "/app/plan/archive"}
            className={
              "block bg-black p-4 transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none " +
              (newer ? "" : "pointer-events-none opacity-30")
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              ← Newer plan
            </div>
            <div className="mt-1 text-sm text-white">
              {newer ? `${newer.id} · ${newer.date}` : "Already newest"}
            </div>
          </Link>
          <Link
            href={older ? `/app/plan/${older.id}` : "/app/plan/archive"}
            className={
              "block bg-black p-4 text-right transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none " +
              (older ? "" : "pointer-events-none opacity-30")
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              Older plan →
            </div>
            <div className="mt-1 text-sm text-white">
              {older ? `${older.id} · ${older.date}` : "Archive bottom"}
            </div>
          </Link>
        </nav>
      </div>
    </div>
  );
}
