"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";
import type { TradingPlan } from "@/features/plan/types";
import {
  commonInstruments as getCommonInstruments,
  computeCompareSummary,
} from "@/features/plan/lib/compare-helpers";
import { Panel, PanelLink } from "@/components/ui/Panel";
import {
  PlanComparePicker,
  PlanCompareSwapButton,
} from "@/features/plan/components/PlanComparePicker";
import { PlanCompareSummary } from "@/features/plan/components/PlanCompareSummary";
import { PlanCompareColumn } from "@/features/plan/components/PlanCompareColumn";
import {
  PlanCompareEmpty,
  PlanCompareInvalid,
} from "@/features/plan/components/PlanCompareEmpty";

interface PlanCompareViewProps {
  allPlans: TradingPlan[];
  latest: TradingPlan | null;
  planA: TradingPlan | null;
  planB: TradingPlan | null;
}

export function PlanCompareView(props: PlanCompareViewProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-[13px] text-white/40">
          Loading compare
        </div>
      }
    >
      <PlanCompareViewInner {...props} />
    </Suspense>
  );
}

function PlanCompareViewInner({
  allPlans,
  latest,
  planA: initialA,
  planB: initialB,
}: PlanCompareViewProps) {
  const searchParams = useSearchParams();

  const [a, setA] = useState<string | null>(() => searchParams.get("a"));
  const [b, setB] = useState<string | null>(() => searchParams.get("b"));

  useUrlSyncedState({ a, b });

  const resolvePlan = (id: string | null): TradingPlan | null => {
    if (!id) return null;
    if (initialA && initialA.id === id) return initialA;
    if (initialB && initialB.id === id) return initialB;
    return allPlans.find((p) => p.id === id) ?? null;
  };

  const planA = resolvePlan(a);
  const planB = resolvePlan(b);

  const commonInstruments = useMemo(
    () => (planA && planB ? getCommonInstruments(planA, planB) : []),
    [planA, planB],
  );

  const summary = useMemo(
    () => (planA && planB ? computeCompareSummary(planA, planB) : null),
    [planA, planB],
  );

  const latestForPicker = latest ?? allPlans[0] ?? null;

  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <Panel
        title="Pick two plans"
        sub="Common instruments highlight, R totals compare, thesis lines up for reading."
        action={<PanelLink href="/app/plan/archive">Archive</PanelLink>}
      >
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <PlanComparePicker
            label="Plan A"
            value={a}
            onChange={setA}
            plans={allPlans}
            latest={latestForPicker ?? allPlans[0]!}
            excludeId={b}
          />
          <PlanCompareSwapButton
            a={a}
            b={b}
            onSwap={() => {
              const nextA = b;
              const nextB = a;
              setA(nextA);
              setB(nextB);
            }}
          />
          <PlanComparePicker
            label="Plan B"
            value={b}
            onChange={setB}
            plans={allPlans}
            latest={latestForPicker ?? allPlans[0]!}
            excludeId={a}
          />
        </div>
      </Panel>

        {!a || !b ? (
          <PlanCompareEmpty />
        ) : !planA || !planB || !summary ? (
          <PlanCompareInvalid />
        ) : (
          <>
            <PlanCompareSummary
              planA={planA}
              planB={planB}
              summary={summary}
              commonInstruments={commonInstruments}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PlanCompareColumn
                plan={planA}
                isLatest={planA.id === (latestForPicker?.id ?? "")}
                highlightInstruments={commonInstruments}
              />
              <PlanCompareColumn
                plan={planB}
                isLatest={planB.id === (latestForPicker?.id ?? "")}
                highlightInstruments={commonInstruments}
              />
            </div>
          </>
        )}
    </div>
  );
}
