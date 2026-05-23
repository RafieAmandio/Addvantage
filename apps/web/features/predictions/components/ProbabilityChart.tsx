"use client";

import { useMemo } from "react";
import type { PriceHistoryPoint } from "../types";

const W = 560;
const H = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatPct(p: number): string {
  return `${(p * 100).toFixed(0)}%`;
}

interface ChartData {
  path: string;
  area: string;
  yTicks: { y: number; label: string }[];
  xTicks: { x: number; label: string }[];
  lastDot: { cx: number; cy: number } | null;
}

const EMPTY: ChartData = { path: "", area: "", yTicks: [], xTicks: [], lastDot: null };

export function ProbabilityChart({
  data,
  label,
}: {
  data: PriceHistoryPoint[];
  label?: string;
}) {
  const chart = useMemo((): ChartData => {
    if (data.length < 2) return EMPTY;

    let rawMin = data[0]!.p;
    let rawMax = data[0]!.p;
    let tMin = data[0]!.t;
    let tMax = data[0]!.t;

    for (const d of data) {
      if (d.p < rawMin) rawMin = d.p;
      if (d.p > rawMax) rawMax = d.p;
      if (d.t < tMin) tMin = d.t;
      if (d.t > tMax) tMax = d.t;
    }

    const padding = Math.max((rawMax - rawMin) * 0.15, 0.02);
    const minP = Math.max(0, rawMin - padding);
    const maxP = Math.min(1, rawMax + padding);
    const tRange = tMax - tMin || 1;
    const pRange = maxP - minP || 1;

    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    const toX = (t: number) => PAD.left + ((t - tMin) / tRange) * plotW;
    const toY = (p: number) => PAD.top + (1 - (p - minP) / pRange) * plotH;

    const points = data.map((d) => `${toX(d.t).toFixed(1)},${toY(d.p).toFixed(1)}`);
    const path = `M${points.join("L")}`;

    const lastPoint = data[data.length - 1]!;
    const area = `${path}L${toX(lastPoint.t).toFixed(1)},${(PAD.top + plotH).toFixed(1)}L${toX(data[0]!.t).toFixed(1)},${(PAD.top + plotH).toFixed(1)}Z`;

    const ySteps = 4;
    const yTicks = Array.from({ length: ySteps + 1 }, (_, i) => {
      const p = minP + (pRange * i) / ySteps;
      return { y: toY(p), label: formatPct(p) };
    });

    const xSteps = Math.min(5, data.length - 1);
    const xTicks = Array.from({ length: xSteps + 1 }, (_, i) => {
      const idx = Math.round((i * (data.length - 1)) / xSteps);
      const d = data[idx]!;
      return { x: toX(d.t), label: formatDate(d.t) };
    });

    const lastDot = { cx: toX(lastPoint.t), cy: toY(lastPoint.p) };

    return { path, area, yTicks, xTicks, lastDot };
  }, [data]);

  if (data.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center text-xs text-white/30">
        Not enough data for chart
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest2 text-white/40">
          {label}
        </p>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {chart.yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="rgba(238,238,238,0.06)"
              strokeWidth="0.5"
            />
            <text
              x={PAD.left - 6}
              y={t.y + 3}
              textAnchor="end"
              className="fill-white/30 font-mono"
              fontSize="9"
            >
              {t.label}
            </text>
          </g>
        ))}

        {chart.xTicks.map((t, i) => (
          <text
            key={i}
            x={t.x}
            y={H - 6}
            textAnchor="middle"
            className="fill-white/30 font-mono"
            fontSize="9"
          >
            {t.label}
          </text>
        ))}

        <defs>
          <linearGradient id="prob-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFD400" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFD400" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={chart.area} fill="url(#prob-fill)" />

        <path
          d={chart.path}
          fill="none"
          stroke="#FFD400"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {chart.lastDot && (
          <circle
            cx={chart.lastDot.cx}
            cy={chart.lastDot.cy}
            r="3"
            fill="#FFD400"
            stroke="#111111"
            strokeWidth="1.5"
          />
        )}
      </svg>
    </div>
  );
}
