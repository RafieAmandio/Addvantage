"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RsiPair, RsiZoneId } from "../types";
import { ZONE_CONFIG, ZONES_ORDERED } from "../lib/zones";
import { RsiTooltip } from "./RsiTooltip";

interface RsiHeatmapProps {
  pairs: RsiPair[];
}

const CHART_HEIGHT = 500;
const PADDING = { top: 20, right: 100, bottom: 20, left: 50 };
const DOT_RADIUS = 7;
const RSI_MIN = 10;
const RSI_MAX = 90;

function seededRandom(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) ^ seed.charCodeAt(i);
  }
  return (Math.abs(h) % 10000) / 10000 || 0.5;
}

export function RsiHeatmap({ pairs }: RsiHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<{ pair: RsiPair; x: number; y: number } | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const [chartWidth, setChartWidth] = useState(900);
  useEffect(() => {
    const update = () => setChartWidth(Math.max(600, window.innerWidth - 320));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const innerW = chartWidth - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const yScale = useCallback(
    (rsi: number) => {
      const clamped = Math.max(RSI_MIN, Math.min(RSI_MAX, rsi));
      return PADDING.top + innerH - ((clamped - RSI_MIN) / (RSI_MAX - RSI_MIN)) * innerH;
    },
    [innerH],
  );

  const avgRsi = useMemo(() => {
    if (pairs.length === 0) return 50;
    return pairs.reduce((s, p) => s + p.rsi, 0) / pairs.length;
  }, [pairs]);

  const dots = useMemo(() => {
    return pairs.map((pair) => {
      const rand = seededRandom(pair.symbol + pair.zone);
      const x = PADDING.left + rand * innerW;
      const y = yScale(pair.rsi);
      return { pair, x, y };
    });
  }, [pairs, innerW, yScale]);

  const handleMouseEnter = useCallback(
    (pair: RsiPair, x: number, y: number) => {
      if (containerRef.current) setContainerRect(containerRef.current.getBoundingClientRect());
      setHovered({ pair, x, y });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => setHovered(null), []);

  const yTicks = [10, 20, 30, 40, 50, 60, 70, 80, 90];

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto">
      <svg
        width={chartWidth}
        height={CHART_HEIGHT}
        viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
        className="select-none"
      >
        {/* Zone bands */}
        {ZONES_ORDERED.map((z) => {
          const cfg = ZONE_CONFIG[z];
          if (cfg.bg === "transparent") return null;
          const y1 = yScale(cfg.max);
          const y2 = yScale(cfg.min);
          return (
            <rect
              key={z}
              x={PADDING.left}
              y={y1}
              width={innerW}
              height={y2 - y1}
              fill={cfg.bg}
            />
          );
        })}

        {/* Y axis grid + labels */}
        {yTicks.map((tick) => {
          const y = yScale(tick);
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={PADDING.left + innerW}
                y2={y}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-white/20 font-mono text-[10px]"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* RSI 30 / 70 dashed threshold lines */}
        {[30, 70].map((threshold) => {
          const y = yScale(threshold);
          const isUpper = threshold === 70;
          return (
            <line
              key={threshold}
              x1={PADDING.left}
              y1={y}
              x2={PADDING.left + innerW}
              y2={y}
              stroke={isUpper ? "rgba(224,60,60,0.25)" : "rgba(34,197,94,0.25)"}
              strokeWidth={1}
              strokeDasharray="6 4"
            />
          );
        })}

        {/* RSI 50 center line */}
        <line
          x1={PADDING.left}
          y1={yScale(50)}
          x2={PADDING.left + innerW}
          y2={yScale(50)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />

        {/* Average RSI line */}
        <line
          x1={PADDING.left}
          y1={yScale(avgRsi)}
          x2={PADDING.left + innerW}
          y2={yScale(avgRsi)}
          stroke="#FFD400"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />
        <text
          x={PADDING.left + innerW + 6}
          y={yScale(avgRsi) + 3}
          className="fill-brand font-mono text-[9px] font-medium"
        >
          AVG {avgRsi.toFixed(1)}
        </text>

        {/* Zone labels on the right */}
        {ZONES_ORDERED.map((z) => {
          const cfg = ZONE_CONFIG[z];
          const midY = yScale((cfg.min + cfg.max) / 2);
          return (
            <text
              key={z}
              x={PADDING.left + innerW + 6}
              y={midY + 4}
              className="font-mono text-[9px] font-bold"
              style={{ fill: cfg.color }}
              opacity={0.5}
            >
              {cfg.label}
            </text>
          );
        })}

        {/* Dots with vertical dashed lines */}
        {dots.map(({ pair, x, y }) => {
          const cfg = ZONE_CONFIG[pair.zone];
          const isHovered = hovered?.pair.symbol === pair.symbol;
          return (
            <g key={pair.symbol}>
              {/* Vertical dashed stem */}
              <line
                x1={x}
                y1={y + DOT_RADIUS}
                x2={x}
                y2={CHART_HEIGHT - PADDING.bottom}
                stroke={cfg.color}
                strokeWidth={0.5}
                strokeDasharray="2 3"
                opacity={isHovered ? 0.5 : 0.15}
              />
              {/* Dot */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? DOT_RADIUS + 2 : DOT_RADIUS}
                fill={cfg.color}
                opacity={isHovered ? 1 : 0.8}
                stroke={isHovered ? "white" : "none"}
                strokeWidth={isHovered ? 1.5 : 0}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => handleMouseEnter(pair, x, y)}
                onMouseLeave={handleMouseLeave}
              />
              {/* Label */}
              <text
                x={x}
                y={y - DOT_RADIUS - 4}
                textAnchor="middle"
                className="pointer-events-none font-mono text-[9px] font-medium"
                style={{ fill: isHovered ? "white" : "rgba(255,255,255,0.5)" }}
              >
                {pair.symbol.replace("/", "")}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <RsiTooltip
          pair={hovered.pair}
          x={hovered.x}
          y={hovered.y}
          containerRect={containerRect}
        />
      )}
    </div>
  );
}
