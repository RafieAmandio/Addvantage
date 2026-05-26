"use client";

import type { AtrPair } from "../types";
import { ATR_ZONE_CONFIG } from "../lib/zones";

interface AtrTooltipProps {
  pair: AtrPair;
  x: number;
  y: number;
  containerRect: DOMRect | null;
}

export function AtrTooltip({ pair, x, y, containerRect }: AtrTooltipProps) {
  const cfg = ATR_ZONE_CONFIG[pair.zone];

  const tooltipW = 210;
  const tooltipH = 200;
  let left = x + 14;
  let top = y - tooltipH / 2;

  if (containerRect) {
    if (left + tooltipW > containerRect.width) left = x - tooltipW - 14;
    if (top < 0) top = 4;
    if (top + tooltipH > containerRect.height) top = containerRect.height - tooltipH - 4;
  }

  const range = pair.upperLevel - pair.lowerLevel;
  const pricePos = range > 0 ? ((pair.price ?? pair.dailyClose) - pair.lowerLevel) / range : 0.5;
  const clampedPos = Math.max(0, Math.min(1, pricePos));

  const rulerH = 80;
  const priceY = rulerH - clampedPos * rulerH;

  const fmt = (n: number) => {
    if (Math.abs(n) >= 100) return n.toFixed(2);
    if (Math.abs(n) >= 1) return n.toFixed(4);
    return n.toFixed(5);
  };

  return (
    <div
      className="pointer-events-none absolute z-50 rounded-lg border border-white/[0.08] bg-black-2 px-3 py-2.5 shadow-xl"
      style={{ left, top, width: tooltipW }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: cfg.color }}
          />
          <span className="font-mono text-sm font-bold text-white">{pair.symbol}</span>
        </div>
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
          style={{ color: cfg.color, backgroundColor: cfg.bg }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Mini price ruler */}
      <div className="mt-2 flex gap-3">
        <svg width="24" height={rulerH + 8} className="shrink-0">
          <line x1="12" y1="4" x2="12" y2={rulerH + 4} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          {/* Upper ATR */}
          <line x1="4" y1="4" x2="20" y2="4" stroke={cfg.color} strokeWidth="1" strokeDasharray="3 2" />
          {/* Lower ATR */}
          <line x1="4" y1={rulerH + 4} x2="20" y2={rulerH + 4} stroke={cfg.color} strokeWidth="1" strokeDasharray="3 2" />
          {/* Current price */}
          <rect x="4" y={priceY + 1} width="16" height="6" rx="1" fill={cfg.color} />
        </svg>
        <div className="flex flex-col justify-between text-[10px]">
          <div className="text-white/40">
            <span className="text-white/60">Upper</span>{" "}
            <span className="font-mono text-white/70">{fmt(pair.upperLevel)}</span>
          </div>
          <div style={{ color: cfg.color }}>
            <span className="font-bold">Price</span>{" "}
            <span className="font-mono font-bold">{fmt(pair.price ?? pair.dailyClose)}</span>
          </div>
          <div className="text-white/40">
            <span className="text-white/60">Lower</span>{" "}
            <span className="font-mono text-white/70">{fmt(pair.lowerLevel)}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-2 space-y-0.5 border-t border-white/[0.06] pt-2 text-xs text-white/50">
        <div className="flex justify-between">
          <span>ATR(20)</span>
          <span className="font-mono text-white/70">{fmt(pair.atr)}</span>
        </div>
        <div className="flex justify-between">
          <span>Range Used</span>
          <span className="font-mono font-medium" style={{ color: cfg.color }}>
            {pair.exhaustionPct.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>Direction</span>
          <span className={pair.direction === "bullish" ? "text-[#65A30D]" : "text-[#E03C3C]"}>
            {pair.direction === "bullish" ? "▲" : "▼"} {pair.direction.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
