"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getAllPlans, getLatestPlan } from "@/features/plan/mock";
import { SectionNumber } from "@/components/ui/Marker";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { BackToTop } from "@/components/ui/BackToTop";
import { useToast } from "@/lib/toast";
import type { HorizonFilter } from "@/features/plan/types";
import {
  groupByMonth,
  matchesQuery,
  parseHorizon,
  parseQuery,
} from "@/features/plan/lib/archive-filters";
import {
  aggregateR as sumR,
  horizonBreakdown,
} from "@/features/plan/lib/archive-stats";
import { archiveDigestMarkdown } from "@/features/plan/lib/archive-digest";
import { PlanArchiveHeader } from "@/features/plan/components/PlanArchiveHeader";
import { PlanArchiveRBar } from "@/features/plan/components/PlanArchiveRBar";
import { PlanArchiveStatsStrip } from "@/features/plan/components/PlanArchiveStatsStrip";
import { PlanArchiveHorizonPanel } from "@/features/plan/components/PlanArchiveHorizonPanel";
import { PlanArchiveEmpty } from "@/features/plan/components/PlanArchiveEmpty";
import { PlanArchiveMonthGroup } from "@/features/plan/components/PlanArchiveMonthGroup";

export default function PlanArchivePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-lime">
            <span className="led lime" />
            DECODING ARCHIVE
          </div>
        </div>
      }
    >
      <PlanArchiveView />
    </Suspense>
  );
}

function PlanArchiveView() {
  const allPlans = getAllPlans();
  const latest = getLatestPlan();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [query, setQuery] = useState<string>(() =>
    parseQuery(searchParams.get("q"))
  );
  const [horizonFilter, setHorizonFilter] = useState<HorizonFilter>(() =>
    parseHorizon(searchParams.get("h"))
  );

  // Sync URL whenever filter or query changes
  useEffect(() => {
    const sp = new URLSearchParams();
    if (horizonFilter !== "all") sp.set("h", horizonFilter);
    if (query) sp.set("q", query);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [horizonFilter, query, pathname, router]);

  const plans = useMemo(() => {
    let filtered =
      horizonFilter === "all"
        ? allPlans
        : allPlans.filter((p) => p.horizon === horizonFilter);
    if (query) filtered = filtered.filter((p) => matchesQuery(p, query));
    return filtered;
  }, [allPlans, horizonFilter, query]);

  const groups = useMemo(() => groupByMonth(plans), [plans]);

  // Aggregate across closed plans IN VIEW (latest excluded since it's live).
  const closed = plans.filter((p) => p.id !== latest.id);
  const aggregateR = sumR(closed);

  // Per-horizon breakdown — always over ALL closed plans.
  const allClosed = allPlans.filter((p) => p.id !== latest.id);
  const horizonR = horizonBreakdown(allClosed);

  const exportDigest = async () => {
    const md = archiveDigestMarkdown(plans, latest.id);
    try {
      await navigator.clipboard.writeText(md);
      toast.push({
        tone: "success",
        title: "Digest exported",
        description: `${plans.length} plan${plans.length === 1 ? "" : "s"}${horizonFilter !== "all" ? ` (${horizonFilter} filter)` : ""} · on your clipboard.`,
      });
    } catch {
      toast.push({
        tone: "error",
        title: "Export failed",
        description: "Browser denied clipboard access.",
      });
    }
  };

  return (
    <div className="bg-grid-fine">
      <BackToTop />
      <PlanArchiveHeader onExportDigest={exportDigest} />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <PlanArchiveRBar allClosed={allClosed} latest={latest} />

        <PlanArchiveStatsStrip
          plansCount={plans.length}
          closedCount={closed.length}
          aggregateR={aggregateR}
          latest={latest}
        />

        <div className="mb-6">
          <PageSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search thesis, setups, instruments, tags…   (press s to focus, esc to blur)"
            ariaLabel="Search archive"
            matchLabel={
              query
                ? `${plans.length} ${plans.length === 1 ? "MATCH" : "MATCHES"} for "${query}"`
                : null
            }
          />
        </div>

        <PlanArchiveHorizonPanel
          horizonFilter={horizonFilter}
          setHorizonFilter={setHorizonFilter}
          aggregateR={aggregateR}
          allClosedCount={allClosed.length}
          horizonR={horizonR}
        />

        <SectionNumber
          n="—"
          label={
            horizonFilter === "all"
              ? `${plans.length} PLANS · ${groups.length} ${groups.length === 1 ? "MONTH" : "MONTHS"}`
              : `${plans.length} ${horizonFilter.toUpperCase()} PLAN${plans.length === 1 ? "" : "S"}`
          }
        />

        {plans.length === 0 && (
          <PlanArchiveEmpty
            horizonFilter={horizonFilter}
            onClear={() => setHorizonFilter("all")}
          />
        )}

        <div className="mt-6 space-y-10">
          {groups.map((group) => (
            <PlanArchiveMonthGroup
              key={group.ym}
              group={group}
              latestId={latest.id}
              query={query}
            />
          ))}
        </div>

        <div className="mt-10 border border-ink-3 bg-ink-2/30 p-5 font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
          ● Plan archive is read-only. Historical plans are never edited after
          publication. If a plan closed outside its stated invalidation, the
          next plan's risks section cites it by ID.
        </div>
      </div>
    </div>
  );
}
