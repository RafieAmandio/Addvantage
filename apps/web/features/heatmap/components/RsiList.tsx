"use client";

import type { RsiPair } from "../types";
import { ZONE_CONFIG } from "../lib/zones";

interface RsiListProps {
  pairs: RsiPair[];
}

export function RsiList({ pairs }: RsiListProps) {
  const sorted = [...pairs].sort((a, b) => b.rsi - a.rsi);

  return (
    <div className="divide-y divide-white/[0.04]">
      {sorted.map((pair) => {
        const cfg = ZONE_CONFIG[pair.zone];
        const pct = Math.max(0, Math.min(100, pair.rsi));
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
            {/* RSI bar */}
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: cfg.color }}
              />
              {/* 30/70 markers */}
              <div className="absolute inset-y-0 left-[30%] w-px bg-white/10" />
              <div className="absolute inset-y-0 left-[70%] w-px bg-white/10" />
            </div>
            <span
              className="w-12 shrink-0 text-right font-mono text-xs font-medium"
              style={{ color: cfg.color }}
            >
              {pair.rsi.toFixed(1)}
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
