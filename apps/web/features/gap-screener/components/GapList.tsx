"use client";

import { cn } from "@/lib/cn";
import type { GapPair } from "../types";

export function GapList({ pairs }: { pairs: GapPair[] }) {
  return (
    <div className="divide-y divide-white/[0.04]">
      {pairs.map((row) => (
        <div
          key={`${row.symbol}-${row.weekStart}`}
          className="px-4 py-3 transition-colors hover:bg-white/[0.02]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white">
                {row.symbol}
              </span>
              <span className={cn(
                "border px-1.5 py-0.5 font-mono text-[9px] font-bold",
                row.setup === "SELL"
                  ? "border-blood/40 bg-blood/10 text-blood-bright"
                  : "border-moss/40 bg-moss/10 text-moss",
              )}>
                {row.setup}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-mono text-sm font-bold",
                row.gapDirection === "UP" ? "text-blood-bright" : "text-moss",
              )}>
                {row.gapPct.toFixed(2)}%
              </span>
              <span className={cn(
                "border px-1.5 py-0.5 font-mono text-[9px] uppercase",
                row.status === "active" ? "border-brand/40 text-brand" :
                row.status === "filled" ? "border-moss/40 text-moss" :
                "border-white/20 text-white/40",
              )}>
                {row.status}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  row.fillPct >= 100 ? "bg-moss" : row.gapDirection === "UP" ? "bg-blood/60" : "bg-brand/60",
                )}
                style={{ width: `${Math.min(100, row.fillPct)}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-white/30">
              {row.fillPct.toFixed(0)}% filled
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
