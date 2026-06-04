"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { GapPair } from "../types";

const GROUP_COLORS: Record<string, string> = {
  major: "text-brand",
  cross: "text-white/50",
  commodity: "text-yellow-400",
  exotic: "text-purple-400",
  index: "text-blue-400",
};

const GROUP_LABELS: Record<string, string> = {
  major: "Major",
  cross: "Cross",
  commodity: "Commodity",
  exotic: "Exotic",
  index: "Index",
};

type SortKey = "symbol" | "gapPct" | "fillPct" | "status";

function FillBar({ pct, direction }: { pct: number; direction: "UP" | "DOWN" }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const filled = clamped >= 100;
  const color = filled
    ? "bg-moss"
    : direction === "UP"
      ? "bg-blood/60"
      : "bg-brand/60";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="font-mono text-[10px] text-white/40">
        {clamped.toFixed(0)}%
      </span>
    </div>
  );
}

export function GapTable({ pairs }: { pairs: GapPair[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("gapPct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "symbol" ? "asc" : "desc"); }
  };

  const sorted = useMemo(() => {
    return [...pairs].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [pairs, sortKey, sortDir]);

  const columns: { key: SortKey; label: string; align: "left" | "center" }[] = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "gapPct", label: "Gap %", align: "center" },
    { key: "fillPct", label: "Fill", align: "center" },
    { key: "status", label: "Status", align: "center" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="w-10 px-3 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
              #
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className={cn(
                  "cursor-pointer px-3 py-3 font-mono text-[10px] font-medium uppercase tracking-wider transition-colors hover:text-white/60",
                  col.align === "left" ? "text-left" : "text-center",
                  sortKey === col.key ? "text-brand" : "text-white/25",
                )}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
            <th className="px-3 py-3 text-center font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
              Dir
            </th>
            <th className="px-3 py-3 text-center font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
              Setup
            </th>
            <th className="px-3 py-3 text-center font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
              Fri Close
            </th>
            <th className="px-3 py-3 text-center font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
              Mon Open
            </th>
            <th className="px-3 py-3 text-center font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
              Current
            </th>
            <th className="px-3 py-3 text-center font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
              R:R
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr
              key={`${row.symbol}-${row.weekStart}`}
              className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
            >
              <td className="px-3 py-3 font-mono text-xs text-white/20">
                {idx + 1}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">
                    {row.symbol}
                  </span>
                  <span className={cn("text-[9px] font-medium uppercase", GROUP_COLORS[row.group] ?? "text-white/30")}>
                    {GROUP_LABELS[row.group] ?? row.group}
                  </span>
                </div>
              </td>
              <td className="px-3 py-3 text-center">
                <span className={cn(
                  "font-mono text-sm font-bold",
                  row.gapPct >= 1 ? "text-brand" : "text-white/70",
                )}>
                  {row.gapPct.toFixed(2)}%
                </span>
              </td>
              <td className="px-3 py-3">
                <FillBar pct={row.fillPct} direction={row.gapDirection} />
              </td>
              <td className="px-3 py-3 text-center">
                <span className={cn(
                  "border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest",
                  row.status === "active" ? "border-brand/40 bg-brand/10 text-brand" :
                  row.status === "filled" ? "border-moss/40 bg-moss/10 text-moss" :
                  "border-white/20 bg-white/5 text-white/40",
                )}>
                  {row.status}
                </span>
              </td>
              <td className="px-3 py-3 text-center">
                <span className={cn(
                  "font-mono text-xs font-bold",
                  row.gapDirection === "UP" ? "text-blood-bright" : "text-moss",
                )}>
                  {row.gapDirection === "UP" ? "▲ UP" : "▼ DOWN"}
                </span>
              </td>
              <td className="px-3 py-3 text-center">
                <span className={cn(
                  "border px-2 py-0.5 font-mono text-[10px] font-bold",
                  row.setup === "SELL"
                    ? "border-blood/40 bg-blood/10 text-blood-bright"
                    : "border-moss/40 bg-moss/10 text-moss",
                )}>
                  {row.setup}
                </span>
              </td>
              <td className="px-3 py-3 text-center font-mono text-xs text-white/50">
                {formatPrice(row.fridayClose)}
              </td>
              <td className="px-3 py-3 text-center font-mono text-xs text-white/50">
                {formatPrice(row.mondayOpen)}
              </td>
              <td className="px-3 py-3 text-center font-mono text-xs text-white/70">
                {row.currentPrice !== null ? formatPrice(row.currentPrice) : "—"}
              </td>
              <td className="px-3 py-3 text-center font-mono text-xs text-white/50">
                1:{row.rr.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatPrice(n: number): string {
  if (n >= 100) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(5);
}
