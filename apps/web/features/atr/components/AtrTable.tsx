"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import type { AtrPair } from "../types";
import { GROUP_LABELS } from "../lib/zones";
import { Pager, PairLink, SortTh, usePage, nextSort, sortRows } from "./FilterControls";

type SortKey = "symbol" | "price" | "exhaustionPct" | "atr" | "direction";

/** One row per pair: range used, direction, then the ATR levels. */
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
  const pg = usePage(sorted, `${sortKey}:${sortDir}:${pairs.map((r) => r.symbol).sort().join(",")}`);

  return (
    <>
    <table className="w-full table-fixed text-left">
      <thead className="border-b border-white/[0.07]">
        <tr>
          <SortTh k="symbol" {...th} className="w-[88px] sm:w-[120px]">Pair</SortTh>
          <SortTh k="exhaustionPct" {...th} className="text-right">Used</SortTh>
          <SortTh k="direction" {...th} className="w-[28px] text-right">
            <span className="sr-only">Direction</span>
          </SortTh>
          <SortTh k="price" {...th} className="w-[96px] text-right">Price</SortTh>
          <SortTh k="atr" {...th} className="hidden w-[84px] text-right sm:table-cell">ATR 20</SortTh>
          <th className="hidden w-[96px] py-2 pr-3 text-right text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40 md:table-cell">Upper</th>
          <th className="hidden w-[96px] py-2 text-right text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40 md:table-cell">Lower</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.07]">
        {pg.rows.map((p) => {
          const bull = p.direction === "bullish";
          return (
            <tr key={p.symbol} className="hover:bg-raised">
              <td className="py-2.5 pr-3">
                <PairLink symbol={p.symbol} sub={GROUP_LABELS[p.group] ?? p.group} />
              </td>
              <td
                className={cn(
                  "py-2.5 pr-3 text-right font-num text-[20px] font-semibold leading-5",
                  p.exhaustionPct >= 100 ? "text-down" : p.exhaustionPct >= 75 ? "text-brand" : "text-white/70",
                )}
              >
                {p.exhaustionPct.toFixed(1)}%
              </td>
              <td className={cn("py-2.5 pr-3 text-right text-[12px]", bull ? "text-up" : "text-down")} title={p.direction}>
                {bull ? "▲" : "▼"}
              </td>
              <td className="py-2.5 pr-3 text-right font-num text-[17px] font-medium text-white/90">
                {p.price !== null ? fmtPrice(p.price) : "n/a"}
              </td>
              <td className="hidden py-2.5 pr-3 text-right font-num text-[17px] font-medium text-white/55 sm:table-cell">{fmtPrice(p.atr)}</td>
              <td className="hidden py-2.5 pr-3 text-right font-num text-[17px] font-medium text-white/55 md:table-cell">{fmtPrice(p.upperLevel)}</td>
              <td className="hidden py-2.5 text-right font-num text-[17px] font-medium text-white/55 md:table-cell">{fmtPrice(p.lowerLevel)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
    <Pager {...pg} />
    </>
  );
}
