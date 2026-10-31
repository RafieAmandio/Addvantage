import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Trading Plan" };
import { listPublishedPlans } from "@/features/plan/queries/plans";
import { getClosedPlanStats } from "@/features/plan/queries/stats";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { splitLevel } from "@/features/plan/lib/detail-helpers";
import { groupByMonth } from "@/features/plan/lib/archive-filters";
import { PlanStatsBadges } from "@/features/plan/components/PlanStatsBadges";
import { PlanArchiveMonthGroup } from "@/features/plan/components/PlanArchiveMonthGroup";
import { PlanArchiveTableHead } from "@/features/plan/components/PlanArchiveRow";
import { Panel, PanelLink } from "@/components/ui/Panel";
import { BiasBadge } from "@/components/ui/Marker";
import { flattenText } from "@/components/ui/ProseText";
import { cn, formatDate } from "@/lib/cn";

const BTN =
  "rounded-full border border-white/[0.14] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";

export default async function PlanPage() {
  const [plans, stats] = await Promise.all([
    listPublishedPlans({ limit: 50 }),
    getClosedPlanStats(),
  ]);

  const allPlans = plans.map(dbPlanToTradingPlan);
  const latest = allPlans[0];

  if (!latest) {
    return (
      <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="No published plan yet">
          <p className="text-[15px] leading-[22px] text-white/55">
            The desk hasn&apos;t published a plan for this cycle. Check back soon.
          </p>
        </Panel>
        <PlanStatsBadges stats={stats} />
      </div>
    );
  }

  const groups = groupByMonth(allPlans);

  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        {/* Current plan, compact. Full detail lives at /app/plan/[id]. */}
        <Panel
          title="Current plan"
          sub={`${latest.id} · ${latest.horizon} · by ${latest.authoredBy}`}
          action={<PanelLink href={`/app/plan/${latest.id}`}>Open plan</PanelLink>}
        >
          <Link
            href={`/app/plan/${latest.id}`}
            className="group block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-num text-[36px] font-semibold leading-10 text-white">{formatDate(latest.date)}</span>
              <BiasBadge bias={latest.bias} />
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-brand">Live</span>
            </div>
            <p className="mt-2 line-clamp-3 text-[15px] leading-[22px] text-white/90 transition-colors group-hover:text-white">
              {flattenText(latest.thesis)}
            </p>
          </Link>
          <ul className="mt-4 divide-y divide-white/[0.07] border-t border-white/[0.07]">
            {latest.setups.map((s) => {
              const long = s.direction === "long";
              return (
                <li key={s.id}>
                  <Link
                    href={`/app/plan/${latest.id}#${s.id}`}
                    className="-mx-2 flex items-baseline gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                  >
                    <span className={cn("w-16 shrink-0 text-[13px] font-semibold", long ? "text-up" : "text-down")}>
                      {long ? "▲ Long" : "▼ Short"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white">{s.instrument}</span>
                    <span className="hidden text-[12px] text-white/40 sm:inline">Entry</span>
                    <span className="truncate font-num text-[18px] font-semibold text-white/90 sm:max-w-[200px]">{splitLevel(s.entry).figure || s.entry}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title="All plans"
          sub={`${allPlans.length} ${allPlans.length === 1 ? "plan" : "plans"} · ${groups.length} ${groups.length === 1 ? "month" : "months"}`}
          action={<PanelLink href="/app/plan/archive">Search and filter</PanelLink>}
        >
          <PlanArchiveTableHead />
          <div className="-mt-2">
            {groups.map((group) => (
              <PlanArchiveMonthGroup key={group.ym} group={group} latestId={latest.id} query="" />
            ))}
          </div>
          {allPlans.length >= 50 && (
            <Link href="/app/plan/archive" className={cn(BTN, "mt-4 inline-block")}>
              View full archive
            </Link>
          )}
        </Panel>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <PlanStatsBadges stats={stats} />
        <div className="flex flex-wrap gap-2">
          <Link href="/app/plan/compare" title="Put two plans side by side" className={BTN}>
            Compare plans
          </Link>
          <Link href="/app/plan/archive" title="Search, filter by horizon, export digest" className={BTN}>
            Archive
          </Link>
        </div>
      </aside>
    </div>
  );
}
