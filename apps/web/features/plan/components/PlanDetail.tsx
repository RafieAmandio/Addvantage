"use client";

import { useEffect } from "react";
import { useAppState, isPaid } from "@/lib/state";
import { SectionNumber } from "@/components/ui/Marker";
import { PaywallOverlay } from "@/components/ui/Paywall";
import { formatDate } from "@/lib/cn";
import { computePlanOutcome } from "@/features/plan/mock";
import { news } from "@/features/news/mock";
import type { TradingPlan } from "@/lib/mock/types";
import { PlanDetailHeader } from "@/features/plan/components/PlanDetailHeader";
import { PlanDetailOutcomeSummary } from "@/features/plan/components/PlanDetailOutcomeSummary";
import { PlanDetailSetupCard } from "@/features/plan/components/PlanDetailSetupCard";
import { PlanDetailInformingNews } from "@/features/plan/components/PlanDetailInformingNews";
import { PlanDetailRisks } from "@/features/plan/components/PlanDetailRisks";

/**
 * Shared renderer for a single trading plan. Used by /app/plan (latest),
 * /app/plan/[id] (archive detail), and anywhere else a plan needs to show
 * with paywall gating, thesis, setups, and risks.
 *
 * Composition-only — all chunks live in sibling `PlanDetail<X>.tsx` files
 * and pure helpers in `features/plan/lib/detail-helpers.ts`.
 */
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

  // News items that directly cite this plan via relatedPlanIds
  const informingNews = news.filter((n) =>
    n.relatedPlanIds?.includes(plan.id)
  );

  // Scroll to hash on mount and on popstate (back/forward navigation)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const scrollToHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;
      // Defer until after paint so the element is mounted and positioned
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add(
            "ring-2",
            "ring-lime",
            "ring-offset-2",
            "ring-offset-ink"
          );
          setTimeout(() => {
            el.classList.remove(
              "ring-2",
              "ring-lime",
              "ring-offset-2",
              "ring-offset-ink"
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
  const risksSectionNumber = informingNews.length > 0 ? "04 /" : "03 /";

  return (
    <div className="bg-grid-fine">
      <PlanDetailHeader
        plan={plan}
        paid={paid}
        isLatest={isLatest}
        headerExtra={headerExtra}
        breadcrumbs={breadcrumbs}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        {!paid && (
          <PaywallOverlay
            surface="Trading Plan"
            reason="The daily / weekly directional plan is restricted to VIP+ Trader. Upgrade to read the thesis, the setups, and the invalidation levels."
          />
        )}

        <div
          className={!paid ? "pointer-events-none select-none blur-sm" : ""}
        >
          {/* Thesis */}
          <section>
            <SectionNumber n="01 /" label="DIRECTIONAL THESIS" />
            <div className="mt-4 border-l-4 border-lime bg-ink-2/40 p-6">
              <p className="font-display text-xl leading-relaxed text-paper">
                {plan.thesis}
              </p>
            </div>
          </section>

          {/* Plan outcome summary — only for archived plans with closed setups */}
          {showOutcome && outcome && (
            <PlanDetailOutcomeSummary outcome={outcome} plan={plan} />
          )}

          {/* Setups */}
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

          {/* Informed by — news articles that cite this plan */}
          {informingNews.length > 0 && (
            <PlanDetailInformingNews
              news={informingNews}
              sectionNumber="03 /"
            />
          )}

          {/* Risks */}
          <PlanDetailRisks
            risks={plan.risks}
            sectionNumber={risksSectionNumber}
          />

          <div className="mt-12 border-t border-ink-3 pt-6 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
            Plan revision · v1 · Authored {formatDate(plan.date)} by{" "}
            {plan.authoredBy} · Reviewed by Desk · Distributed via DOMAIN /
            Telegram
          </div>
        </div>
      </div>
    </div>
  );
}
