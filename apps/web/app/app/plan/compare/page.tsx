"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getAllPlans,
  getLatestPlan,
  getPlanById,
} from "@/features/plan/mock";
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

export default function PlanComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-lime">
            <span className="led lime" />
            PREPARING COMPARE
          </div>
        </div>
      }
    >
      <PlanCompareView />
    </Suspense>
  );
}

function PlanCompareView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const allPlans = getAllPlans();
  const latest = getLatestPlan();

  const [a, setA] = useState<string | null>(() => searchParams.get("a"));
  const [b, setB] = useState<string | null>(() => searchParams.get("b"));

  useEffect(() => {
    const sp = new URLSearchParams();
    if (a) sp.set("a", a);
    if (b) sp.set("b", b);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [a, b, pathname, router]);

  const planA = a ? getPlanById(a) : null;
  const planB = b ? getPlanById(b) : null;

  const commonInstruments = useMemo(
    () => (planA && planB ? getCommonInstruments(planA, planB) : []),
    [planA, planB]
  );

  const summary = useMemo(
    () => (planA && planB ? computeCompareSummary(planA, planB) : null),
    [planA, planB]
  );

  return (
    <div className="bg-grid-fine">
      <PlanCompareHero />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Pickers */}
        <div className="mb-6 grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <PlanComparePicker
            label="Plan A"
            value={a}
            onChange={setA}
            plans={allPlans}
            latest={latest}
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
            latest={latest}
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
                isLatest={planA.id === latest.id}
                highlightInstruments={commonInstruments}
              />
              <PlanCompareColumn
                plan={planB}
                isLatest={planB.id === latest.id}
                highlightInstruments={commonInstruments}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
