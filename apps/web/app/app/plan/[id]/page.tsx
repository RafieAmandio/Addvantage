import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPlanById,
  getLatestPlan,
  getAllPlans,
  tradingPlans,
} from "@/lib/mock/plans";
import { PlanDetail } from "@/components/ui/PlanDetail";
import { PlanSiblingKeys } from "@/components/ui/PlanSiblingKeys";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

/**
 * Pre-declare all known plan IDs. `dynamicParams = false` tells Next that
 * anything not in this list is a 404 — skips the static-paths worker's
 * introspection pass that's been racing the manifest JSON in dev.
 */
export function generateStaticParams() {
  return tradingPlans.map((p) => ({ id: p.id }));
}

export const dynamicParams = false;

export default function PlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const plan = getPlanById(params.id);
  if (!plan) return notFound();

  const isLatest = plan.id === getLatestPlan().id;
  const all = getAllPlans();
  const idx = all.findIndex((p) => p.id === plan.id);
  const newer = idx > 0 ? all[idx - 1] : null;
  const older = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <div>
      <PlanSiblingKeys
        newerId={newer?.id ?? null}
        olderId={older?.id ?? null}
        firstId={all[0].id}
        lastId={all[all.length - 1].id}
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
              className="border border-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
            >
              ⇌ COMPARE
            </Link>
            <Link
              href="/app/plan/archive"
              className="border border-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
            >
              ← Archive
            </Link>
          </div>
        }
      />

      {/* Prev / next siblings */}
      <div className="mx-auto max-w-7xl px-6 pb-12">
        <nav className="grid grid-cols-2 gap-px border border-ink-3 bg-ink-3">
          <Link
            href={newer ? `/app/plan/${newer.id}` : "/app/plan/archive"}
            className={
              "block bg-ink p-4 transition-colors hover:bg-ink-2 " +
              (newer ? "" : "pointer-events-none opacity-30")
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              ← Newer plan
            </div>
            <div className="mt-1 text-sm text-paper">
              {newer ? `${newer.id} · ${newer.date}` : "Already newest"}
            </div>
          </Link>
          <Link
            href={older ? `/app/plan/${older.id}` : "/app/plan/archive"}
            className={
              "block bg-ink p-4 text-right transition-colors hover:bg-ink-2 " +
              (older ? "" : "pointer-events-none opacity-30")
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              Older plan →
            </div>
            <div className="mt-1 text-sm text-paper">
              {older ? `${older.id} · ${older.date}` : "Archive bottom"}
            </div>
          </Link>
        </nav>
      </div>
    </div>
  );
}
