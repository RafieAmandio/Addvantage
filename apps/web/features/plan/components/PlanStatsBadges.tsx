import { cn } from "@/lib/cn";
import type { ClosedPlanStats } from "@/features/plan/types";

type Props = {
  stats: ClosedPlanStats;
  className?: string;
};

function formatPct(v: number | null): string {
  if (v === null) return "—";
  return `${Math.round(v * 100)}%`;
}

function formatR(v: number | null): string {
  if (v === null) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}R`;
}

function rTone(v: number | null): string {
  if (v === null) return "text-white";
  if (v > 0) return "text-moss";
  if (v < 0) return "text-red-500";
  return "text-white";
}

export function PlanStatsBadges({ stats, className }: Props) {
  if (stats.n === 0) {
    return (
      <div
        className={cn(
          "mb-6 inline-flex items-center gap-2 border border-gray-3 bg-gray-2/40 px-3 py-1.5",
          className,
        )}
      >
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          Closed-plan stats
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/50">
          No closed plans yet
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-6 grid grid-cols-2 gap-px bg-gray-3 sm:grid-cols-4",
        className,
      )}
    >
      <div className="bg-black p-4">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          Closed
        </div>
        <div className="mt-1 font-display text-2xl text-white">{stats.n}</div>
      </div>
      <div className="bg-black p-4">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          Win rate
        </div>
        <div className="mt-1 font-display text-2xl text-white">
          {formatPct(stats.winRate)}
        </div>
      </div>
      <div className="bg-black p-4">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          Avg R
        </div>
        <div
          className={cn("mt-1 font-display text-2xl", rTone(stats.avgR))}
        >
          {formatR(stats.avgR)}
        </div>
      </div>
      <div className="bg-black p-4">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          By direction
        </div>
        <div className="mt-1 flex flex-col gap-0.5 font-mono text-[10px] uppercase tracking-widest2 text-white/70">
          <span>
            Long {stats.byDirection.long.n} ·{" "}
            {formatPct(stats.byDirection.long.winRate)} ·{" "}
            <span className={rTone(stats.byDirection.long.avgR)}>
              {formatR(stats.byDirection.long.avgR)}
            </span>
          </span>
          <span>
            Short {stats.byDirection.short.n} ·{" "}
            {formatPct(stats.byDirection.short.winRate)} ·{" "}
            <span className={rTone(stats.byDirection.short.avgR)}>
              {formatR(stats.byDirection.short.avgR)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
