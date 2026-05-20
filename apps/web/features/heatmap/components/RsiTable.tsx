"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { RsiTableRow, RsiZoneId } from "../types";
import { ZONE_CONFIG, GROUP_LABELS } from "../lib/zones";

interface RsiTableProps {
  pairs: RsiTableRow[];
}

type SortKey = "symbol" | "price" | "rsi1h" | "rsi4h" | "rsi1d";

const GROUP_COLORS: Record<string, string> = {
  major: "text-brand",
  cross: "text-white/50",
  commodity: "text-yellow-400",
  exotic: "text-purple-400",
  index: "text-blue-400",
};

function RsiCell({ rsi, zone }: { rsi: number | null; zone: string | null }) {
  if (rsi === null) return <td className="px-3 py-3 text-center font-mono text-xs text-white/15">—</td>;
  const cfg = zone ? ZONE_CONFIG[zone as RsiZoneId] : null;
  const color = cfg?.color ?? "#6B7280";
  return (
    <td className="px-3 py-3 text-center font-mono text-xs font-medium" style={{ color }}>
      {rsi.toFixed(2)}
    </td>
  );
}

export function RsiTable({ pairs }: RsiTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("symbol");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

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

  const columns: { key: SortKey; label: string }[] = [
    { key: "symbol", label: "Symbol" },
    { key: "price", label: "Price" },
    { key: "rsi1h", label: "RSI (1H)" },
    { key: "rsi4h", label: "RSI (4H)" },
    { key: "rsi1d", label: "RSI (1D)" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
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
                  col.key === "symbol" ? "text-left" : "text-center",
                  sortKey === col.key ? "text-brand" : "text-white/25",
                )}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr
              key={row.symbol}
              onClick={() => router.push(`/app/instrument/${encodeURIComponent(row.symbol)}`)}
              className="cursor-pointer border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
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
              <td className="px-3 py-3 text-center font-mono text-xs text-white/50">
                {row.price !== null ? row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : "—"}
              </td>
              <RsiCell rsi={row.rsi1h} zone={row.zone1h} />
              <RsiCell rsi={row.rsi4h} zone={row.zone4h} />
              <RsiCell rsi={row.rsi1d} zone={row.zone1d} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
