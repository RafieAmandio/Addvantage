"use client";

import { useEffect } from "react";
import { useAppState, isPaid } from "@/lib/state";
import { SectionNumber } from "@/components/ui/Marker";
import { PaywallOverlay } from "@/components/ui/Paywall";
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
          el.classList.add(
            "ring-2",
            "ring-brand",
            "ring-offset-2",
            "ring-offset-black"
          );
          setTimeout(() => {
            el.classList.remove(
              "ring-2",
              "ring-brand",
              "ring-offset-2",
              "ring-offset-black"
            );
          }, 2400);
        }
      }, 200);
    };

    scrollToHash();
    window.addEventListener("popstate", scrollToHash);
    return () => window.removeEventListener("popstate", scrollToHash);
  }, [plan.id]);

  const showOutcome = outcome && !isLatest;

  return (
    <div className="stagger bg-grid-fine">
      <PlanDetailHeader
        plan={plan}
        paid={paid}
        isLatest={isLatest}
        headerExtra={headerExtra}
        breadcrumbs={breadcrumbs}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {!paid && (
          <PaywallOverlay
            surface="Trading Plan"
            reason="The daily / weekly directional plan is restricted to VIP+ Trader. Upgrade to read the thesis, the setups, and the invalidation levels."
          />
        )}

        <div
          className={!paid ? "pointer-events-none select-none blur-sm" : ""}
        >
          <section>
            <SectionNumber n="01 /" label="DIRECTIONAL THESIS" />
            <div className="mt-4 border-l-4 border-brand bg-gray-2/40 p-6">
              <p className="font-display text-xl leading-relaxed text-white">
                {plan.thesis}
              </p>
            </div>
            {plan.imageUrl && (
              <a
                href={plan.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block"
              >
                <img
                  src={plan.imageUrl}
                  alt={`Chart for ${plan.setups[0]?.instrument ?? "plan"}`}
                  className="max-h-[600px] w-full rounded border border-gray-3 object-contain"
                />
              </a>
            )}
          </section>

          {showOutcome && outcome && (
            <PlanDetailOutcomeSummary outcome={outcome} plan={plan} />
          )}

          <section className="mt-12">
            <SectionNumber
              n="02 /"
              label={`SETUPS · ${plan.setups.length} ${isLatest ? "LIVE" : "ON RECORD"}`}
            />
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {plan.setups.map((s) => (
                <PlanDetailSetupCard
                  key={s.id}
                  setup={s}
                  planId={plan.id}
                  isLatest={isLatest}
                />
              ))}
            </div>
          </section>

          <PlanDetailRisks
            risks={plan.risks}
            sectionNumber="03 /"
          />

          <div className="mt-12 border-t border-gray-3 pt-6 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            Plan revision · v1 · Authored {formatDate(plan.date)} by{" "}
            {plan.authoredBy} · Reviewed by Desk · Distributed via DOMAIN /
            Telegram
          </div>
        </div>
      </div>
    </div>
  );
}
