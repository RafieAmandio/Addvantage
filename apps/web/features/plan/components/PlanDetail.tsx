"use client";

import { useEffect } from "react";
import { useAppState, isPaid } from "@/lib/state";
import { Panel } from "@/components/ui/Panel";
import { PaywallOverlay } from "@/components/ui/Paywall";
import { ProseText } from "@/components/ui/ProseText";
import { formatDate } from "@/lib/cn";
import { computePlanOutcome } from "@/features/plan/lib/detail-helpers";
import type { TradingPlan } from "@/features/plan/types";
import { PlanDetailHeader } from "@/features/plan/components/PlanDetailHeader";
import { PlanDetailOutcomeSummary } from "@/features/plan/components/PlanDetailOutcomeSummary";
import { PlanDetailSetupCard } from "@/features/plan/components/PlanDetailSetupCard";
import { PlanDetailRisks } from "@/features/plan/components/PlanDetailRisks";

export function PlanDetail({
  plan,
  headerExtra,
  isLatest,
  breadcrumbs,
}: {
  plan: TradingPlan;
  headerExtra?: React.ReactNode;
  isLatest?: boolean;
  breadcrumbs?: React.ReactNode;
}) {
  const { tier } = useAppState();
  const paid = isPaid(tier);
  const outcome = computePlanOutcome(plan);

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-1", "ring-brand");
          setTimeout(() => el.classList.remove("ring-1", "ring-brand"), 2400);
        }
      }, 200);
    };

    scrollToHash();
    window.addEventListener("popstate", scrollToHash);
    return () => window.removeEventListener("popstate", scrollToHash);
  }, [plan.id]);

  const showOutcome = !!outcome && !isLatest;
  const longs = plan.setups.filter((s) => s.direction === "long").length;
  const shorts = plan.setups.length - longs;

  return (
    <div className="space-y-4">
      {breadcrumbs}
      <PlanDetailHeader plan={plan} paid={paid} isLatest={isLatest} headerExtra={headerExtra} />

      <div className="relative">
        {!paid && (
          <div className="absolute inset-x-0 top-40 z-20">
          <PaywallOverlay
            surface="Trading Plan"
            reason="The daily / weekly directional plan is restricted to VIP+ Trader. Upgrade to read the thesis, the setups, and the invalidation levels."
          />
          </div>
        )}

        <div
          className={
            "grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]" +
            (!paid ? " pointer-events-none select-none blur-sm" : "")
          }
        >
          <div className="min-w-0 space-y-4">
            <Panel title="Thesis">
              <ProseText
                text={plan.thesis}
                className="space-y-3"
                paragraphClassName="text-[17px] leading-[26px] text-white/90"
              />
              {plan.imageUrl && (
                <a href={plan.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block">
                  <img
                    src={plan.imageUrl}
                    alt={`Chart for ${plan.setups[0]?.instrument ?? "plan"}`}
                    className="max-h-[600px] w-full rounded-xl bg-raised object-contain"
                  />
                </a>
              )}
            </Panel>

            <Panel
              title={`Setups · ${plan.setups.length}`}
              sub={isLatest ? "Live in the current plan" : "On record"}
            >
              <div className="divide-y divide-white/[0.07]">
                {plan.setups.map((s) => (
                  <PlanDetailSetupCard key={s.id} setup={s} planId={plan.id} isLatest={isLatest} />
                ))}
              </div>
            </Panel>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            {showOutcome && outcome ? (
              <PlanDetailOutcomeSummary outcome={outcome} plan={plan} />
            ) : (
              <Panel title="Outcome" sub={isLatest ? "Live plan, no outcome yet" : "No setups closed yet"}>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Long</p>
                    <p className="font-num text-[36px] font-semibold leading-10 text-up">{longs}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Short</p>
                    <p className="font-num text-[36px] font-semibold leading-10 text-down">{shorts}</p>
                  </div>
                </div>
              </Panel>
            )}
            <PlanDetailRisks risks={plan.risks} sectionNumber="" />
            <p className="px-1 text-[12px] leading-[18px] text-white/30">
              Authored {formatDate(plan.date)} by {plan.authoredBy}. Reviewed by the desk, distributed via TradeVantage and Telegram.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
