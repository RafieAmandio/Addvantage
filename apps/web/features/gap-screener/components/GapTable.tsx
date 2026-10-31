"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { PairLink, SortTh, nextSort, sortRows } from "@/features/atr/components/FilterControls";
import type { GapPair } from "../types";

const GROUP_LABELS: Record<string, string> = { major: "Major", cross: "Cross", commodity: "Commodity", index: "Index" };

type SortKey = "symbol" | "gapPct" | "fillPct" | "status";

const STATUS_CLASS: Record<GapPair["status"], string> = {
  active: "text-brand",
  filled: "text-white/55",
  expired: "text-white/30",
};

export function GapTable({ pairs }: { pairs: GapPair[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("gapPct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const sorted = useMemo(() => sortRows(pairs, sortKey, sortDir), [pairs, sortKey, sortDir]);
  const sort = (k: SortKey) => {
    const [key, dir] = nextSort(k, sortKey, sortDir, "symbol");
    setSortKey(key);
    setSortDir(dir);
  };
  const th = { sortKey, dir: sortDir, onSort: sort };
  const plain = "py-2 pr-3 text-right text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

  return (
    <table className="w-full table-fixed text-left">
      <thead className="border-b border-white/[0.07]">
        <tr>
          <SortTh k="symbol" {...th} className="w-[92px] sm:w-[120px]">Pair</SortTh>
          <th className={cn(plain, "w-[64px] text-left")}>Setup</th>
          <SortTh k="gapPct" {...th} className="w-[60px] text-right">Gap</SortTh>
          <SortTh k="fillPct" {...th}>Fill</SortTh>
          <SortTh k="status" {...th} className="hidden w-[72px] sm:table-cell">Status</SortTh>
          <th className={cn(plain, "hidden w-[92px] lg:table-cell")}>Fri close</th>
          <th className={cn(plain, "hidden w-[92px] lg:table-cell")}>Mon open</th>
          <th className={cn(plain, "hidden w-[92px] md:table-cell")}>Current</th>
          <th className={cn(plain, "hidden w-[56px] pr-0 md:table-cell")}>R:R</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.07]">
        {sorted.map((r) => {
          const fill = Math.min(100, Math.max(0, r.fillPct));
          return (
            <tr key={`${r.symbol}-${r.weekStart}`} className="hover:bg-raised">
              <td className="py-2.5 pr-3">
                <PairLink symbol={r.symbol} sub={GROUP_LABELS[r.group] ?? r.group} />
              </td>
              <td className={cn("py-2.5 pr-3 text-[13px] font-semibold", r.setup === "BUY" ? "text-up" : "text-down")}>
                {r.setup === "BUY" ? "▲ Buy" : "▼ Sell"}
              </td>
              <td className={cn("py-2.5 pr-3 text-right font-num text-[20px] font-semibold leading-5", r.gapDirection === "UP" ? "text-up" : "text-down")}>
                {r.gapPct.toFixed(2)}
              </td>
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2">
                  <div className="h-1 min-w-0 flex-1 rounded-full bg-white/[0.08]">
                    <div className={cn("h-full rounded-full", fill >= 100 ? "bg-white/55" : "bg-brand")} style={{ width: `${fill}%` }} />
                  </div>
                  <span className="w-9 text-right font-num text-[15px] font-medium text-white/55">{Math.round(fill)}%</span>
                </div>
              </td>
              <td className={cn("hidden py-2.5 pr-3 text-[13px] font-medium capitalize sm:table-cell", STATUS_CLASS[r.status])}>{r.status}</td>
              <td className="hidden py-2.5 pr-3 text-right font-num text-[17px] font-medium text-white/55 lg:table-cell">{fmtPrice(r.fridayClose)}</td>
              <td className="hidden py-2.5 pr-3 text-right font-num text-[17px] font-medium text-white/55 lg:table-cell">{fmtPrice(r.mondayOpen)}</td>
              <td className="hidden py-2.5 pr-3 text-right font-num text-[17px] font-medium text-white/90 md:table-cell">
                {r.currentPrice !== null ? fmtPrice(r.currentPrice) : "n/a"}
              </td>
              <td className="hidden py-2.5 text-right font-num text-[17px] font-medium text-white/55 md:table-cell">1:{r.rr.toFixed(1)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
