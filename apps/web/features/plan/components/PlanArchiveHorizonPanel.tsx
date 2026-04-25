import { cn } from "@/lib/cn";
import type {
  HorizonFilter,
  HorizonRBreakdown,
} from "@/features/plan/types";

type Props = {
  horizonFilter: HorizonFilter;
  setHorizonFilter: (h: HorizonFilter) => void;
  aggregateR: number;
  allClosedCount: number;
  horizonR: HorizonRBreakdown;
  className?: string;
};

export function PlanArchiveHorizonPanel({
  horizonFilter,
  setHorizonFilter,
  aggregateR,
  allClosedCount,
  horizonR,
  className,
}: Props) {
  return (
    <div
      className={cn("mb-10 border border-gray-3 bg-gray-2/30 p-5", className)}
    >
      <div className="flex items-center justify-between">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
          ● Edge by horizon · click to filter
        </div>
        {horizonFilter !== "all" && (
          <button
            onClick={() => setHorizonFilter("all")}
            className="border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-brand hover:text-brand"
          >
            ✕ Clear
          </button>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-px bg-gray-3 sm:grid-cols-4">
        <button
          onClick={() => setHorizonFilter("all")}
          className={cn(
            "bg-ink p-4 text-left transition-colors",
            horizonFilter === "all"
              ? "border-l-2 border-lime bg-gray-2"
              : "hover:bg-gray-2"
          )}
        >
          <div className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
            ALL
          </div>
          <div
            className={
              "mt-1 font-display text-2xl " +
              (allClosedCount === 0
                ? "text-paper/30"
                : aggregateR > 0
                ? "text-moss"
                : aggregateR < 0
                ? "text-blood"
                : "text-paper/70")
            }
          >
            {allClosedCount === 0
              ? "—"
              : (aggregateR >= 0 ? "+" : "") + aggregateR.toFixed(1) + "R"}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
            {allClosedCount} closed
          </div>
        </button>
        {(["intraday", "swing", "weekly"] as const).map((h) => {
          const data = horizonR[h];
          const noData = data.n === 0;
          return (
            <button
              key={h}
              onClick={() => setHorizonFilter(h)}
              disabled={noData}
              className={cn(
                "bg-ink p-4 text-left transition-colors",
                horizonFilter === h
                  ? "border-l-2 border-lime bg-gray-2"
                  : noData
                  ? "cursor-default opacity-60"
                  : "hover:bg-gray-2"
              )}
            >
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
                {h}
              </div>
              <div
                className={
                  "mt-1 font-display text-2xl " +
                  (noData
                    ? "text-paper/30"
                    : data.r > 0
                    ? "text-moss"
                    : data.r < 0
                    ? "text-blood"
                    : "text-paper/70")
                }
              >
                {noData
                  ? "—"
                  : (data.r >= 0 ? "+" : "") + data.r.toFixed(1) + "R"}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                {data.n} {data.n === 1 ? "plan" : "plans"}
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
        ● Sample size matters more than the number itself. With {allClosedCount}{" "}
        closed plan{allClosedCount === 1 ? "" : "s"}, this is signal direction,
        not edge.
      </p>
    </div>
  );
}
