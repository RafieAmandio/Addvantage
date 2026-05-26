"use client";

import type { AtrPair } from "../types";
import { ATR_ZONE_CONFIG } from "../lib/zones";

interface AtrListProps {
  pairs: AtrPair[];
}

export function AtrList({ pairs }: AtrListProps) {
  const sorted = [...pairs].sort((a, b) => b.exhaustionPct - a.exhaustionPct);

  return (
    <div className="divide-y divide-white/[0.04]">
      {sorted.map((pair) => {
        const cfg = ATR_ZONE_CONFIG[pair.zone];
        const pct = Math.max(0, Math.min(100, pair.exhaustionPct));
        const isBullish = pair.direction === "bullish";
        const isExceeded = pair.exhaustionPct >= 100;

        return (
          <div
            key={pair.symbol}
            className="flex items-center gap-3 px-4 py-2.5 sm:px-6"
          >
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: cfg.color }}
            />
            <span className="w-20 shrink-0 font-mono text-xs font-bold text-white">
              {pair.symbol}
            </span>
            {/* Exhaustion bar */}
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: cfg.color }}
              />
              <div className="absolute inset-y-0 left-[50%] w-px bg-white/10" />
              <div className="absolute inset-y-0 left-[75%] w-px bg-white/10" />
            </div>
            <span
              className="w-14 shrink-0 text-right font-mono text-xs font-medium"
              style={{ color: cfg.color }}
            >
              {pair.exhaustionPct.toFixed(1)}%
              {isExceeded && " !"}
            </span>
            <span
              className="w-4 shrink-0 text-center font-mono text-xs font-bold"
              style={{ color: isBullish ? "#65A30D" : "#E03C3C" }}
            >
              {isBullish ? "▲" : "▼"}
            </span>
            {pair.price !== null && (
              <span className="hidden w-20 shrink-0 text-right font-mono text-[10px] text-white/30 sm:block">
                {pair.price.toLocaleString()}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
