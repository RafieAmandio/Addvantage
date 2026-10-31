import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { rTone } from "@/features/plan/lib/detail-helpers";
import type { HorizonFilter, HorizonRBreakdown } from "@/features/plan/types";

type Props = {
  horizonFilter: HorizonFilter;
  setHorizonFilter: (h: HorizonFilter) => void;
  aggregateR: number;
  allClosedCount: number;
  horizonR: HorizonRBreakdown;
  className?: string;
};

/** Realised R per horizon; each row filters the list. */
export function PlanArchiveHorizonPanel({
  horizonFilter,
  setHorizonFilter,
  aggregateR,
  allClosedCount,
  horizonR,
  className,
}: Props) {
  const rows: Array<{ id: HorizonFilter; n: number; r: number }> = [
    { id: "all", n: allClosedCount, r: aggregateR },
    ...(["intraday", "swing", "weekly"] as const).map((h) => ({ id: h, n: horizonR[h].n, r: horizonR[h].r })),
  ];

  return (
    <Panel
      title="Edge by horizon"
      sub={`${allClosedCount} closed plan${allClosedCount === 1 ? "" : "s"}. Direction, not proof of edge.`}
      className={className}
    >
      <div className="-my-1 divide-y divide-white/[0.07]">
        {rows.map(({ id, n, r }) => {
          const active = horizonFilter === id;
          const noData = n === 0;
          return (
            <button
              key={id}
              onClick={() => setHorizonFilter(id)}
              disabled={noData && id !== "all"}
              aria-pressed={active}
              className={cn(
                "-mx-2 flex w-[calc(100%+1rem)] items-baseline gap-3 rounded-lg px-2 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
                active ? "bg-raised" : "hover:bg-raised disabled:cursor-default disabled:hover:bg-transparent",
              )}
            >
              <span className={cn("flex-1 text-[14px] font-medium capitalize", active ? "text-white" : "text-white/55")}>
                {id}
              </span>
              <span className="text-[12px] text-white/30">
                {n} {n === 1 ? "plan" : "plans"}
              </span>
              <span className={cn("w-16 text-right font-num text-[20px] font-semibold", noData ? "text-white/30" : rTone(r))}>
                {noData ? "n/a" : `${r >= 0 ? "+" : ""}${r.toFixed(1)}R`}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
