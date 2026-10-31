"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { AtrGauge } from "@/features/instrument/components/DotMatrix";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import type { AtrPair } from "../types";
import { GROUP_LABELS } from "../lib/zones";
import { PairLink, SortTh, nextSort, sortRows } from "./FilterControls";

type SortKey = "symbol" | "price" | "exhaustionPct" | "atr" | "direction";

/** One row per pair: range used as a dot gauge, then the ATR levels. */
export function AtrTable({ pairs }: { pairs: AtrPair[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("exhaustionPct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const sorted = useMemo(() => sortRows(pairs, sortKey, sortDir), [pairs, sortKey, sortDir]);
  const sort = (k: SortKey) => {
    const [key, dir] = nextSort(k, sortKey, sortDir, "symbol");
    setSortKey(key);
    setSortDir(dir);
  };
  const th = { sortKey, dir: sortDir, onSort: sort };

  return (
    <table className="w-full table-fixed text-left">
      <thead className="border-b border-white/[0.07]">
        <tr>
          <SortTh k="symbol" {...th} className="w-[88px] sm:w-[120px]">Pair</SortTh>
          <th className="py-2 pr-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Range used</th>
          <SortTh k="exhaustionPct" {...th} className="w-[56px] text-right">Used</SortTh>
          <SortTh k="direction" {...th} className="w-[28px] text-right">
            <span className="sr-only">Direction</span>
          </SortTh>
          <SortTh k="price" {...th} className="hidden w-[96px] text-right md:table-cell">Price</SortTh>
          <SortTh k="atr" {...th} className="hidden w-[84px] text-right lg:table-cell">ATR 20</SortTh>
          <th className="hidden w-[96px] py-2 pr-3 text-right text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40 xl:table-cell">Upper</th>
          <th className="hidden w-[96px] py-2 text-right text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40 xl:table-cell">Lower</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.07]">
        {sorted.map((p) => {
          const bull = p.direction === "bullish";
          return (
            <tr key={p.symbol} className="hover:bg-raised">
              <td className="py-2.5 pr-3">
                <PairLink symbol={p.symbol} sub={GROUP_LABELS[p.group] ?? p.group} />
              </td>
              <td className="py-2.5 pr-3">
                <div className="max-w-[260px]">
                  <AtrGauge usedPct={p.exhaustionPct} />
                </div>
              </td>
              <td
                className={cn(
                  "py-2.5 pr-3 text-right font-num text-[20px] font-semibold leading-5",
                  p.exhaustionPct >= 100 ? "text-down" : p.exhaustionPct >= 75 ? "text-brand" : "text-white/70",
                )}
              >
                {Math.round(p.exhaustionPct)}
              </td>
              <td className={cn("py-2.5 pr-3 text-right text-[12px]", bull ? "text-up" : "text-down")} title={p.direction}>
                {bull ? "▲" : "▼"}
              </td>
              <td className="hidden py-2.5 pr-3 text-right font-num text-[17px] font-medium text-white/90 md:table-cell">
                {p.price !== null ? fmtPrice(p.price) : "n/a"}
              </td>
              <td className="hidden py-2.5 pr-3 text-right font-num text-[17px] font-medium text-white/55 lg:table-cell">{fmtPrice(p.atr)}</td>
              <td className="hidden py-2.5 pr-3 text-right font-num text-[17px] font-medium text-white/55 xl:table-cell">{fmtPrice(p.upperLevel)}</td>
              <td className="hidden py-2.5 text-right font-num text-[17px] font-medium text-white/55 xl:table-cell">{fmtPrice(p.lowerLevel)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
