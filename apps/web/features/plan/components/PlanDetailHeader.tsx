"use client";

import { DataLabel } from "@/components/ui/Marker";
import { formatDate } from "@/lib/cn";
import { useToast } from "@/lib/toast";
import type { TradingPlan } from "@/lib/mock/types";
import { planToMarkdown } from "@/features/plan/lib/detail-helpers";

/**
 * Top banner for `PlanDetail` — breadcrumbs, title, access indicator, and
 * the "export markdown" action (paid only). Extracted from `PlanDetail.tsx`.
 */
export function PlanDetailHeader({
  plan,
  paid,
  isLatest,
  headerExtra,
  breadcrumbs,
}: {
  plan: TradingPlan;
  paid: boolean;
  isLatest?: boolean;
  headerExtra?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}) {
  const toast = useToast();

  const exportPlanMarkdown = async () => {
    const md = planToMarkdown(plan);
    try {
      await navigator.clipboard.writeText(md);
      toast.push({
        tone: "success",
        title: "Plan exported",
        description: `${plan.id} · ${plan.setups.length} setups · markdown on your clipboard, paste anywhere.`,
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
    <div className="border-b border-ink-3 bg-ink-2/30">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {breadcrumbs && <div className="mb-4">{breadcrumbs}</div>}
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <DataLabel>Transmission TX-03 · Restricted</DataLabel>
              {isLatest && (
                <span className="border border-lime bg-lime/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-lime">
                  ● LATEST
                </span>
              )}
              {!isLatest && (
                <span className="border border-ink-3 bg-ink px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/50">
                  ARCHIVE
                </span>
              )}
            </div>
            <h1 className="mt-2 font-display text-5xl text-paper">
              Trading <span className="italic text-lime">Plan</span>
            </h1>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-widest2 text-paper/40">
              Plan ID <span className="text-paper">{plan.id}</span> ·{" "}
              {formatDate(plan.date)} · Authored by{" "}
              <span className="text-paper">{plan.authoredBy}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="font-mono text-[10px] uppercase tracking-widest2">
              <div className={paid ? "text-moss" : "text-blood"}>
                ● {paid ? "ACCESS GRANTED" : "ACCESS DENIED"}
              </div>
              <div className="text-paper/40">Horizon · {plan.horizon}</div>
            </div>
            <div className="flex items-center gap-2">
              {paid && (
                <button
                  onClick={exportPlanMarkdown}
                  title="Copy this plan as markdown to your clipboard"
                  className="border border-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
                >
                  ⇩ EXPORT MD
                </button>
              )}
              {headerExtra}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
