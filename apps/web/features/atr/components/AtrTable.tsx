"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { AtrPair, AtrZoneId } from "../types";
import { ATR_ZONE_CONFIG, GROUP_LABELS } from "../lib/zones";

interface AtrTableProps {
  pairs: AtrPair[];
}

type SortKey = "symbol" | "price" | "exhaustionPct" | "atr" | "direction";

const GROUP_COLORS: Record<string, string> = {
  major: "text-brand",
  cross: "text-white/50",
  commodity: "text-yellow-400",
  index: "text-blue-400",
};

const fmt = (n: number) => {
  if (Math.abs(n) >= 100) return n.toFixed(2);
  if (Math.abs(n) >= 1) return n.toFixed(4);
  return n.toFixed(5);
};

export function AtrTable({ pairs }: AtrTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("exhaustionPct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "symbol" ? "asc" : "desc");
    }
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

  const columns: { key: SortKey; label: string; align: "left" | "center" | "right" }[] = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "price", label: "Price", align: "right" },
    { key: "exhaustionPct", label: "Exhaustion", align: "center" },
    { key: "direction", label: "Dir", align: "center" },
    { key: "atr", label: "ATR(20)", align: "right" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
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
                  col.align === "left" ? "text-left" : col.align === "right" ? "text-right" : "text-center",
                  sortKey === col.key ? "text-brand" : "text-white/25",
                )}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
            <th className="px-3 py-3 text-right font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
              Upper
            </th>
            <th className="px-3 py-3 text-right font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
              Lower
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => {
            const cfg = ATR_ZONE_CONFIG[row.zone as AtrZoneId];
            const isBullish = row.direction === "bullish";
            const isExceeded = row.zone === "exceeded";
            return (
              <tr
                key={row.symbol}
                className={cn(
                  "border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]",
                  isExceeded && "bg-[#FF6B35]/[0.03]",
                )}
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
                <td className="px-3 py-3 text-right font-mono text-xs text-white/50">
                  {row.price !== null
                    ? fmt(row.price)
                    : "—"}
                </td>
                <td className="px-3 py-3 text-center font-mono text-xs font-medium" style={{ color: cfg?.color }}>
                  {row.exhaustionPct.toFixed(1)}%
                </td>
                <td className="px-3 py-3 text-center">
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: isBullish ? "#65A30D" : "#E03C3C" }}
                  >
                    {isBullish ? "▲" : "▼"}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs text-white/50">
                  {fmt(row.atr)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs text-white/40">
                  {fmt(row.upperLevel)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs text-white/40">
                  {fmt(row.lowerLevel)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
