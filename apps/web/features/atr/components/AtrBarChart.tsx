"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AtrPair } from "../types";
import { ATR_ZONE_CONFIG } from "../lib/zones";
import { AtrTooltip } from "./AtrTooltip";

interface AtrBarChartProps {
  pairs: AtrPair[];
}

const ROW_HEIGHT = 22;
const PADDING = { top: 24, right: 72, bottom: 16, left: 90 };
const MAX_PCT = 130;

const THRESHOLDS = [25, 50, 75, 100];

export function AtrBarChart({ pairs }: AtrBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<{ pair: AtrPair; x: number; y: number } | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const [chartWidth, setChartWidth] = useState(900);
  useEffect(() => {
    const update = () => setChartWidth(Math.max(600, window.innerWidth - 320));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const chartHeight = PADDING.top + pairs.length * ROW_HEIGHT + PADDING.bottom;
  const innerW = chartWidth - PADDING.left - PADDING.right;

  const pctToX = useCallback(
    (pct: number) => (Math.min(pct, MAX_PCT) / MAX_PCT) * innerW,
    [innerW],
  );

  const handleMouseEnter = useCallback(
    (pair: AtrPair, x: number, y: number) => {
      if (containerRef.current) setContainerRect(containerRef.current.getBoundingClientRect());
      setHovered({ pair, x, y });
    },
    [],
  );
  const handleMouseLeave = useCallback(() => setHovered(null), []);

  const sorted = useMemo(
    () => [...pairs].sort((a, b) => b.exhaustionPct - a.exhaustionPct),
    [pairs],
  );

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto">
      <svg
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="select-none"
      >
        {/* Zone bands (vertical) */}
        {Object.entries(ATR_ZONE_CONFIG).map(([id, cfg]) => {
          if (cfg.bg === "transparent") return null;
          const x1 = PADDING.left + pctToX(Math.min(cfg.min, MAX_PCT));
          const x2 = PADDING.left + pctToX(Math.min(cfg.max === Infinity ? MAX_PCT : cfg.max, MAX_PCT));
          if (x2 - x1 <= 0) return null;
          return (
            <rect
              key={id}
              x={x1}
              y={PADDING.top - 4}
              width={x2 - x1}
              height={sorted.length * ROW_HEIGHT + 8}
              fill={cfg.bg}
            />
          );
        })}

        {/* Threshold lines */}
        {THRESHOLDS.map((pct) => {
          const x = PADDING.left + pctToX(pct);
          const is100 = pct === 100;
          return (
            <g key={pct}>
              <line
                x1={x}
                y1={PADDING.top - 4}
                x2={x}
                y2={PADDING.top + sorted.length * ROW_HEIGHT + 4}
                stroke={is100 ? "rgba(255,212,0,0.3)" : "rgba(255,255,255,0.04)"}
                strokeWidth={is100 ? 1.5 : 1}
                strokeDasharray={is100 ? "6 4" : "2 4"}
              />
              <text
                x={x}
                y={PADDING.top - 8}
                textAnchor="middle"
                className="fill-white/15 font-mono text-[8px]"
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {sorted.map((pair, idx) => {
          const cfg = ATR_ZONE_CONFIG[pair.zone];
          const y = PADDING.top + idx * ROW_HEIGHT;
          const barW = pctToX(pair.exhaustionPct);
          const isHovered = hovered?.pair.symbol === pair.symbol;
          const stagger = Math.min(idx * 15, 600);
          const isBullish = pair.direction === "bullish";

          return (
            <g
              key={pair.symbol}
              className="cursor-pointer"
              onMouseEnter={() => handleMouseEnter(pair, PADDING.left + barW, y + ROW_HEIGHT / 2)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Row hover bg */}
              {isHovered && (
                <rect
                  x={PADDING.left}
                  y={y}
                  width={innerW}
                  height={ROW_HEIGHT}
                  fill="rgba(255,255,255,0.02)"
                />
              )}

              {/* Symbol label */}
              <text
                x={PADDING.left - 8}
                y={y + ROW_HEIGHT / 2 + 4}
                textAnchor="end"
                className="font-mono text-[10px] font-medium"
                fill={isHovered ? "#fff" : "rgba(255,255,255,0.5)"}
              >
                {pair.symbol.replace("/", "")}
              </text>

              {/* Bar */}
              <rect
                x={PADDING.left}
                y={y + 4}
                width={barW}
                height={ROW_HEIGHT - 8}
                rx={2}
                fill={cfg.color}
                opacity={isHovered ? 1 : 0.75}
                style={{
                  animation: `atr-bar-in 0.3s ease-out ${stagger}ms both`,
                  transformOrigin: `${PADDING.left}px ${y + ROW_HEIGHT / 2}px`,
                }}
              />

              {/* Direction arrow */}
              <text
                x={PADDING.left + barW + 6}
                y={y + ROW_HEIGHT / 2 + 4}
                className="font-mono text-[10px] font-bold"
                fill={isBullish ? "#65A30D" : "#E03C3C"}
              >
                {isBullish ? "▲" : "▼"}
              </text>

              {/* Exhaustion % label */}
              <text
                x={chartWidth - PADDING.right + 24}
                y={y + ROW_HEIGHT / 2 + 4}
                textAnchor="end"
                className="font-mono text-[10px] font-medium"
                fill={cfg.color}
              >
                {pair.exhaustionPct.toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>

      {hovered && (
        <AtrTooltip
          pair={hovered.pair}
          x={hovered.x}
          y={hovered.y}
          containerRect={containerRect}
        />
      )}
    </div>
  );
}
