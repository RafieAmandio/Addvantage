import { memo } from "react";
import { cn } from "@/lib/cn";
import type { PlanMonthGroup } from "@/features/plan/types";
import { PlanArchiveRow } from "@/features/plan/components/PlanArchiveRow";
import { monthTotalR } from "@/features/plan/lib/archive-stats";
import { rTone } from "@/features/plan/lib/detail-helpers";

type Props = {
  group: PlanMonthGroup;
  latestId: string;
  query: string;
};

function PlanArchiveMonthGroupImpl({ group, latestId, query }: Props) {
  const mR = monthTotalR(group.plans, latestId);
  const closedInMonth = group.plans.filter((p) => p.id !== latestId).length;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 pb-1 pt-4">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
          {group.label}
          <span className="ml-2 text-white/30">
            {group.plans.length} {group.plans.length === 1 ? "plan" : "plans"}
          </span>
        </h3>
        {closedInMonth > 0 && (
          <span className={cn("font-num text-[17px] font-semibold", rTone(mR))}>
            {(mR >= 0 ? "+" : "") + mR.toFixed(1)}R
          </span>
        )}
      </div>
      <div className="divide-y divide-white/[0.07]">
        {group.plans.map((p) => (
          <PlanArchiveRow key={p.id} plan={p} isLatest={p.id === latestId} query={query} />
        ))}
      </div>
    </section>
  );
}

export const PlanArchiveMonthGroup = memo(PlanArchiveMonthGroupImpl);
