"use client";

import { cn } from "@/lib/cn";
import { formatOdds } from "../lib/format";
import type { Outcome } from "../types";

export function OutcomeRow({ outcome }: { outcome: Outcome }) {
  const barWidth = Math.max(2, Math.min(outcome.probability, 100));
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="truncate text-xs text-white/70">
            {outcome.label}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-white/40">
            {formatOdds(outcome.odds)}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden bg-white/[0.06]">
          <div
            className="h-full bg-brand/60 transition-all duration-500"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 border px-2 py-0.5 font-mono text-xs font-medium tabular-nums",
          outcome.probability >= 50
            ? "border-brand/30 text-brand"
            : "border-white/[0.1] text-white/60",
        )}
      >
        {outcome.probability.toFixed(1)}%
      </span>
    </div>
  );
}
