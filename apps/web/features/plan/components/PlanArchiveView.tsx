"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";
import { Panel } from "@/components/ui/Panel";
import { TextTabs } from "@/components/ui/TextTabs";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { BackToTop } from "@/components/ui/BackToTop";
import { useToast } from "@/lib/toast";
import type { TradingPlan } from "@/features/plan/types";
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
import { PlanArchiveTableHead } from "@/features/plan/components/PlanArchiveRow";

const HORIZONS = [
  { id: "all", label: "All" },
  { id: "intraday", label: "Intraday" },
  { id: "swing", label: "Swing" },
  { id: "weekly", label: "Weekly" },
] as const;

interface PlanArchiveViewProps {
  allPlans: TradingPlan[];
  latest: TradingPlan | null;
}

export function PlanArchiveView(props: PlanArchiveViewProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-[13px] text-white/40">
          Loading archive
        </div>
      }
    >
      <PlanArchiveViewInner {...props} />
    </Suspense>
  );
}

function PlanArchiveViewInner({ allPlans, latest }: PlanArchiveViewProps) {
  const searchParams = useSearchParams();
  const toast = useToast();

  const [query, setQuery] = useState<string>(() =>
    parseQuery(searchParams.get("q")),
  );
  const [horizonFilter, setHorizonFilter] = useState<HorizonFilter>(() =>
    parseHorizon(searchParams.get("h")),
  );

  useUrlSyncedState({
    h: horizonFilter !== "all" ? horizonFilter : null,
    q: query || null,
  });

  const plans = useMemo(() => {
    let filtered =
      horizonFilter === "all"
        ? allPlans
        : allPlans.filter((p) => p.horizon === horizonFilter);
    if (query) filtered = filtered.filter((p) => matchesQuery(p, query));
    return filtered;
  }, [allPlans, horizonFilter, query]);

  const groups = useMemo(() => groupByMonth(plans), [plans]);

  const latestId = latest?.id ?? null;
  const closed = plans.filter((p) => p.id !== latestId);
  const aggregateR = sumR(closed);

  const allClosed = allPlans.filter((p) => p.id !== latestId);
  const horizonR = horizonBreakdown(allClosed);

  const exportDigest = async () => {
    const md = archiveDigestMarkdown(plans, latestId ?? "");
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
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <BackToTop />
      <div className="min-w-0 space-y-4">
        <PageSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search plans, instruments, tags"
          ariaLabel="Search archive"
          matchLabel={
            query
              ? `${plans.length} ${plans.length === 1 ? "match" : "matches"} for "${query}"`
              : null
          }
        />

        <Panel
          title={
            horizonFilter === "all"
              ? `${plans.length} ${plans.length === 1 ? "plan" : "plans"}`
              : `${plans.length} ${horizonFilter} plan${plans.length === 1 ? "" : "s"}`
          }
          sub={`${groups.length} ${groups.length === 1 ? "month" : "months"} · read-only, never edited after publication`}
          action={
            <TextTabs
              options={HORIZONS}
              value={horizonFilter}
              onChange={setHorizonFilter}
              label="Horizon"
              className="hidden sm:flex"
            />
          }
        >
          <TextTabs
            options={HORIZONS}
            value={horizonFilter}
            onChange={setHorizonFilter}
            label="Horizon"
            className="-mt-1 mb-2 sm:hidden"
          />
          {plans.length === 0 ? (
            <PlanArchiveEmpty
              horizonFilter={horizonFilter}
              onClear={() => {
                setHorizonFilter("all");
                setQuery("");
              }}
            />
          ) : (
            <>
              <PlanArchiveTableHead />
              <div className="-mt-2">
                {groups.map((group) => (
                  <PlanArchiveMonthGroup
                    key={group.ym}
                    group={group}
                    latestId={latestId ?? ""}
                    query={query}
                  />
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <PlanArchiveHeader onExportDigest={exportDigest} />
        {latest && (
          <PlanArchiveStatsStrip
            plansCount={plans.length}
            closedCount={closed.length}
            aggregateR={aggregateR}
            latest={latest}
          />
        )}
        {latest && <PlanArchiveRBar allClosed={allClosed} latest={latest} />}
        <PlanArchiveHorizonPanel
          horizonFilter={horizonFilter}
          setHorizonFilter={setHorizonFilter}
          aggregateR={aggregateR}
          allClosedCount={allClosed.length}
          horizonR={horizonR}
        />
        <p className="px-1 text-[12px] leading-[18px] text-white/30">
          If a plan closed outside its stated invalidation, the next plan&apos;s risks section cites it by ID.
        </p>
      </aside>
    </div>
  );
}
