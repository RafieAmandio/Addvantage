import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Trading Plan" };
import { listPublishedPlans } from "@/features/plan/queries/plans";
import { getClosedPlanStats } from "@/features/plan/queries/stats";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { groupByMonth } from "@/features/plan/lib/archive-filters";
import { PlanStatsBadges } from "@/features/plan/components/PlanStatsBadges";
import { PlanArchiveMonthGroup } from "@/features/plan/components/PlanArchiveMonthGroup";
import { SectionNumber, DataLabel } from "@/components/ui/Marker";
import { cn, formatDate } from "@/lib/cn";

export default async function PlanPage() {
  const [plans, stats] = await Promise.all([
    listPublishedPlans({ limit: 50 }),
    getClosedPlanStats(),
  ]);

  const allPlans = plans.map(dbPlanToTradingPlan);
  const latest = allPlans[0];

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
          </div>
        </div>
      </div>
    );
  }

  const groups = groupByMonth(allPlans);
  const longs = latest.setups.filter((s) => s.direction === "long").length;
  const shorts = latest.setups.filter((s) => s.direction === "short").length;

  return (
    <div className="stagger bg-grid-fine">
      {/* Page header */}
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <DataLabel>Trading Plan</DataLabel>
              <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl md:text-5xl">
                Trading <span className="italic text-brand">Plan</span>
              </h1>
              <p className="mt-2 max-w-2xl font-display text-lg text-white/60">
                Every plan the desk has shipped — the live plan is up top, the
                full history sits right below. Nothing is scrubbed when a trade
                closes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/app/plan/compare"
                title="Put two plans side by side"
                className="border border-gray-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                ⇌ COMPARE
              </Link>
              <Link
                href="/app/plan/archive"
                title="Search, filter by horizon, export digest"
                className="border border-gray-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                ⌕ SEARCH / FILTER
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <PlanStatsBadges stats={stats} />

        {/* Current plan — compact, emphasized. Full detail lives at /app/plan/[id]. */}
        <section>
          <SectionNumber n="01 /" label="CURRENT PLAN" />
          <Link
            href={`/app/plan/${latest.id}`}
            className="group mt-4 block border border-brand bg-brand/[0.06] p-6 transition-all hover:-translate-y-px hover:bg-brand/10 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none sm:p-8"
          >
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                    {latest.id}
                  </span>
                  <span className="border border-brand bg-brand/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest2 text-brand">
                    ● LATEST
                  </span>
                </div>
                <div className="mt-2 font-display text-3xl text-white">
                  {formatDate(latest.date)}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                  {latest.horizon} · by {latest.authoredBy}
                </div>
                <div className="mt-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2">
                  <span className="text-moss">▲ {longs} long</span>
                  <span className="text-white/30">·</span>
                  <span className="text-brand">▼ {shorts} short</span>
                </div>
                <div className="mt-3 border-t border-brand/30 pt-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">
                  ● LIVE · no outcome yet
                </div>
              </div>

              <div className="col-span-12 lg:col-span-9">
                <p className="line-clamp-3 font-display text-xl leading-relaxed text-white/90 transition-colors group-hover:text-white">
                  {latest.thesis}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {latest.setups.map((s) => (
                    <span
                      key={s.id}
                      className={cn(
                        "border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2",
                        s.direction === "long"
                          ? "border-moss/50 text-moss"
                          : "border-brand/50 text-brand",
                      )}
                    >
                      {s.direction === "long" ? "▲" : "▼"} {s.instrument}
                    </span>
                  ))}
                </div>
                <div className="mt-5 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors group-hover:text-white">
                  Read full plan — thesis, setups &amp; invalidation →
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* All plans — the full scannable list, latest included and marked. */}
        <section className="mt-12">
          <SectionNumber
            n="02 /"
            label={`ALL PLANS · ${allPlans.length} · ${groups.length} ${
              groups.length === 1 ? "MONTH" : "MONTHS"
            }`}
          />
          <div className="mt-6 space-y-10">
            {groups.map((group) => (
              <PlanArchiveMonthGroup
                key={group.ym}
                group={group}
                latestId={latest.id}
                query=""
              />
            ))}
          </div>

          {allPlans.length >= 50 && (
            <div className="mt-8 text-center">
              <Link
                href="/app/plan/archive"
                className="inline-block border border-gray-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand"
              >
                View full archive (search / filter) →
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
