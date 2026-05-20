"use client";

import type { RsiPair } from "../types";
import { ZONE_CONFIG } from "../lib/zones";

interface RsiTooltipProps {
  pair: RsiPair;
  x: number;
  y: number;
  containerRect: DOMRect | null;
}

export function RsiTooltip({ pair, x, y, containerRect }: RsiTooltipProps) {
  const cfg = ZONE_CONFIG[pair.zone];

  const tooltipW = 180;
  const tooltipH = 100;
  let left = x + 14;
  let top = y - tooltipH / 2;

  if (containerRect) {
    if (left + tooltipW > containerRect.width) left = x - tooltipW - 14;
    if (top < 0) top = 4;
    if (top + tooltipH > containerRect.height) top = containerRect.height - tooltipH - 4;
  }

  return (
    <div
      className="pointer-events-none absolute z-50 rounded-lg border border-white/[0.08] bg-black-2 px-3 py-2.5 shadow-xl"
      style={{ left, top, width: tooltipW }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: cfg.color }}
        />
        <span className="font-mono text-sm font-bold text-white">{pair.symbol}</span>
      </div>
      <div className="mt-1.5 space-y-0.5 text-xs text-white/50">
        <div className="flex justify-between">
          <span>RSI</span>
          <span className="font-mono font-medium" style={{ color: cfg.color }}>
            {pair.rsi.toFixed(2)}
          </span>
        </div>
        {pair.price !== null && (
          <div className="flex justify-between">
            <span>Price</span>
            <span className="font-mono text-white/70">{pair.price.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Zone</span>
          <span className="font-medium uppercase" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}
