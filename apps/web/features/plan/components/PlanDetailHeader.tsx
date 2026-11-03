"use client";

import { BiasBadge } from "@/components/ui/Marker";
import { formatDate } from "@/lib/cn";
import { useToast } from "@/lib/toast";
import type { TradingPlan } from "@/features/plan/types";
import { planToMarkdown } from "@/features/plan/lib/detail-helpers";

/** Plan meta line plus actions. The TopBar already carries the page title. */
export function PlanDetailHeader({
  plan,
  paid,
  isLatest,
  headerExtra,
}: {
  plan: TradingPlan;
  paid: boolean;
  isLatest?: boolean;
  headerExtra?: React.ReactNode;
}) {
  const toast = useToast();

  const exportPlanMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(planToMarkdown(plan));
      toast.push({
        tone: "success",
        title: "Plan exported",
        description: `${plan.id} · ${plan.setups.length} setups · markdown on your clipboard, paste anywhere.`,
      });
    } catch {
      toast.push({ tone: "error", title: "Export failed", description: "Browser denied clipboard access." });
    }
  };

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
          <span className={isLatest ? "text-brand" : undefined}>{isLatest ? "Latest plan" : "Archive"}</span>
          <span>{plan.id}</span>
          <span>{plan.horizon}</span>
          {plan.bias && <BiasBadge bias={plan.bias} />}
        </p>
        <p className="mt-1 font-num text-[36px] font-semibold leading-10 text-white sm:text-[44px] sm:leading-[48px]">
          {formatDate(plan.date)}
        </p>
        <p className="text-[13px] text-white/55">by {plan.authoredBy}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {paid && (
          <button
            onClick={exportPlanMarkdown}
            title="Copy this plan as markdown to your clipboard"
            className="rounded-full border border-white/[0.14] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Export markdown
          </button>
        )}
        {headerExtra}
      </div>
    </div>
  );
}
