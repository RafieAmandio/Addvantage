"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";
import type { TradingPlan } from "@/features/plan/types";
import {
  commonInstruments as getCommonInstruments,
  computeCompareSummary,
} from "@/features/plan/lib/compare-helpers";
import { PlanCompareHero } from "@/features/plan/components/PlanCompareHero";
import {
  PlanComparePicker,
  PlanCompareSwapButton,
} from "@/features/plan/components/PlanComparePicker";
import {
  PlanCompareSummary,
  PlanCompareCommonChips,
} from "@/features/plan/components/PlanCompareSummary";
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
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">
            <span className="led" aria-hidden />
            PREPARING COMPARE
          </div>
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
    <div className="stagger bg-grid-fine">
      <PlanCompareHero />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
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

            <PlanCompareCommonChips instruments={commonInstruments} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
    </div>
  );
}
