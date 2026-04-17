import type { PlanMonthGroup } from "@/features/plan/types";
import { PlanArchiveRow } from "@/features/plan/components/PlanArchiveRow";
import { monthTotalR } from "@/features/plan/lib/archive-stats";

type Props = {
  group: PlanMonthGroup;
  latestId: string;
  query: string;
};

export function PlanArchiveMonthGroup({ group, latestId, query }: Props) {
  const mR = monthTotalR(group.plans, latestId);
  const closedInMonth = group.plans.filter((p) => p.id !== latestId).length;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-lime/30 pb-2">
        <div className="flex items-baseline gap-3">
          <div className="font-display text-3xl italic text-lime">
            {group.label}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
            · {group.plans.length}{" "}
            {group.plans.length === 1 ? "plan" : "plans"}
          </div>
        </div>
        {closedInMonth > 0 && (
          <div className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
            <span>Month R ·</span>
            <span
              className={
                "font-display text-xl " +
                (mR > 0
                  ? "text-moss"
                  : mR < 0
                  ? "text-blood"
                  : "text-paper/70")
              }
            >
              {(mR >= 0 ? "+" : "") + mR.toFixed(1)}R
            </span>
          </div>
        )}
      </div>

      <div className="space-y-px bg-ink-3">
        {group.plans.map((p) => (
          <PlanArchiveRow
            key={p.id}
            plan={p}
            isLatest={p.id === latestId}
            query={query}
          />
        ))}
      </div>
    </section>
  );
}
