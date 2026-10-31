"use client";

import { useMemo, useState } from "react";
import { RsiMeter } from "@/features/instrument/components/DotMatrix";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { PairLink, SortTh, nextSort, sortRows } from "@/features/atr/components/FilterControls";
import type { RsiPair, RsiTableRow, RsiZoneId } from "../types";
import { ZONE_CONFIG, GROUP_LABELS } from "../lib/zones";

const zoneColor = (zone: string | null) => (zone ? ZONE_CONFIG[zone as RsiZoneId]?.color : undefined) ?? "rgba(255,255,255,.55)";

/** One timeframe, ranked: a dot meter per pair, most overbought first. */
export function RsiRanked({ pairs }: { pairs: RsiPair[] }) {
  const sorted = useMemo(() => [...pairs].sort((a, b) => b.rsi - a.rsi), [pairs]);
  return (
    <ul className="divide-y divide-white/[0.07]">
      {sorted.map((p) => (
        <li key={p.symbol} className="grid grid-cols-[88px_minmax(0,1fr)_48px] items-center gap-3 py-2.5 sm:grid-cols-[120px_minmax(0,1fr)_56px_96px_96px]">
          <PairLink symbol={p.symbol} sub={GROUP_LABELS[p.group] ?? p.group} />
          <div className="max-w-[200px]">
            <RsiMeter rsi={p.rsi} />
          </div>
          <span className="text-right font-num text-[20px] font-semibold leading-5" style={{ color: zoneColor(p.zone) }}>
            {p.rsi.toFixed(1)}
          </span>
          <span className="hidden text-[13px] font-medium sm:block" style={{ color: zoneColor(p.zone) }}>
            {ZONE_CONFIG[p.zone]?.label}
          </span>
          <span className="hidden text-right font-num text-[17px] font-medium text-white/55 sm:block">
            {p.price !== null ? fmtPrice(p.price) : "n/a"}
          </span>
        </li>
      ))}
    </ul>
  );
}

type SortKey = "symbol" | "price" | "rsi1h" | "rsi4h" | "rsi1d";

function RsiCell({ rsi, zone }: { rsi: number | null; zone: string | null }) {
  return (
    <td className="py-2.5 pr-3 text-right font-num text-[18px] font-semibold leading-5 last:pr-0" style={{ color: rsi === null ? "rgba(255,255,255,.2)" : zoneColor(zone) }}>
      {rsi === null ? "n/a" : rsi.toFixed(1)}
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
          <SortTh k="rsi1h" {...th} className="text-right">1H</SortTh>
          <SortTh k="rsi4h" {...th} className="text-right">4H</SortTh>
          <SortTh k="rsi1d" {...th} className="text-right">1D</SortTh>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.07]">
        {sorted.map((r) => (
          <tr key={r.symbol} className="hover:bg-raised">
            <td className="py-2.5 pr-3">
              <PairLink symbol={r.symbol} sub={GROUP_LABELS[r.group] ?? r.group} />
            </td>
            <td className="hidden py-2.5 pr-3 text-right font-num text-[17px] font-medium text-white/55 sm:table-cell">
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
