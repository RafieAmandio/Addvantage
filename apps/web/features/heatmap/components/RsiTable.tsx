"use client";

import { useMemo, useState } from "react";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { PairLink, SortTh, nextSort, sortRows } from "@/features/atr/components/FilterControls";
import type { RsiTableRow, RsiZoneId } from "../types";
import { ZONE_CONFIG, GROUP_LABELS } from "../lib/zones";

const zoneColor = (zone: string | null) => (zone ? ZONE_CONFIG[zone as RsiZoneId]?.color : undefined) ?? "rgba(255,255,255,.55)";

type SortKey = "symbol" | "price" | "rsi1h" | "rsi4h" | "rsi1d";

function RsiCell({ rsi, zone }: { rsi: number | null; zone: string | null }) {
  const cfg = zone ? ZONE_CONFIG[zone as RsiZoneId] : undefined;
  return (
    <td className="p-0.5">
      <div
        className="flex h-10 items-center justify-end px-3 font-num text-[18px] font-semibold leading-5"
        style={{ backgroundColor: rsi === null ? undefined : cfg?.cell, color: rsi === null ? "rgba(255,255,255,.2)" : zoneColor(zone) }}
        title={cfg?.label}
      >
        {rsi === null ? "n/a" : rsi.toFixed(1)}
      </div>
    </td>
  );
}

/** Every pair across 1H, 4H and 1D, sortable. */
export function RsiTable({ pairs }: { pairs: RsiTableRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("symbol");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
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
          <SortTh k="symbol" {...th} className="w-[100px] sm:w-[140px]">Pair</SortTh>
          <SortTh k="price" {...th} className="hidden text-right sm:table-cell">Price</SortTh>
          <SortTh k="rsi1h" {...th} className="text-right !pr-3.5">1H</SortTh>
          <SortTh k="rsi4h" {...th} className="text-right !pr-3.5">4H</SortTh>
          <SortTh k="rsi1d" {...th} className="text-right !pr-3.5">1D</SortTh>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => (
          <tr key={r.symbol} className="hover:bg-raised">
            <td className="py-1 pr-3">
              <PairLink symbol={r.symbol} sub={GROUP_LABELS[r.group] ?? r.group} />
            </td>
            <td className="hidden py-1 pr-3 text-right font-num text-[17px] font-medium text-white/55 sm:table-cell">
              {r.price !== null ? fmtPrice(r.price) : "n/a"}
            </td>
            <RsiCell rsi={r.rsi1h} zone={r.zone1h} />
            <RsiCell rsi={r.rsi4h} zone={r.zone4h} />
            <RsiCell rsi={r.rsi1d} zone={r.zone1d} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
