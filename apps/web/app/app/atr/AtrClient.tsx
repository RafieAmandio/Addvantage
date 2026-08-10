"use client";

import { useCallback, useMemo, useState } from "react";
import type { AtrZoneId } from "@/features/atr/types";
import type { ForexTier } from "@tradevantage/shared";
import { ATR_ZONES_ORDERED } from "@/features/atr/lib/zones";
import { useAtrData } from "@/features/atr/hooks/useAtrData";
import { AtrToolbar } from "@/features/atr/components/AtrToolbar";
import { AtrBarChart } from "@/features/atr/components/AtrBarChart";
import { AtrList } from "@/features/atr/components/AtrList";
import { AtrTable } from "@/features/atr/components/AtrTable";

const ALL_GROUPS = new Set(["major", "cross", "commodity", "index"]);

export default function AtrClient() {
  const [activeTier, setActiveTier] = useState<ForexTier | "all">("all");
  const [activeZones, setActiveZones] = useState<Set<AtrZoneId>>(
    () => new Set(ATR_ZONES_ORDERED),
  );
  const [activeGroups, setActiveGroups] = useState<Set<string>>(
    () => new Set(ALL_GROUPS),
  );

  const { data, loading, error } = useAtrData();

  const toggleZone = useCallback((z: AtrZoneId) => {
    setActiveZones((prev) => {
      const next = new Set(prev);
      if (next.has(z)) next.delete(z);
      else next.add(z);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((g: string) => {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }, []);

  const filteredPairs = useMemo(() => {
    if (!data) return [];
    return data.pairs.filter(
      (p) =>
        activeZones.has(p.zone) &&
        activeGroups.has(p.group) &&
        (activeTier === "all" || p.tier === activeTier),
    );
  }, [data, activeZones, activeGroups, activeTier]);

  const totalCount = data?.pairs.length ?? 0;
  const exceededCount = data?.pairs.filter((p) => p.zone === "exceeded").length ?? 0;

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/[0.06] px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-lg font-bold text-white">
            ATR Daily Levels
          </h1>
          {!loading && !error && totalCount > 0 && (
            <span className="flex items-center gap-1.5 rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-white/30">
              <span className="led" aria-hidden />
              {totalCount} instruments
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-white/30">
          20-period ATR exhaustion across major pairs, crosses, commodities, and
          indices. Pairs near 100% have used up their daily range.
        </p>
      </div>

      <AtrToolbar
        activeTier={activeTier}
        onTierChange={setActiveTier}
        activeZones={activeZones}
        onToggleZone={toggleZone}
        activeGroups={activeGroups}
        onToggleGroup={toggleGroup}
        pairCount={filteredPairs.length}
        totalCount={totalCount}
        exceededCount={exceededCount}
        updatedAt={data?.updatedAt ?? null}
      />

      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-brand">
            <span className="led" aria-hidden />
            Computing ATR levels
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-12 text-center text-sm text-white/40 sm:px-6">
          {error}
        </div>
      )}

      {!loading && !error && filteredPairs.length === 0 && (
        <div className="px-4 py-20 text-center sm:px-6">
          <p className="text-sm text-white/30">
            {data && data.pairs.length === 0
              ? "No ATR data available yet. The worker syncs every 4 hours."
              : "No pairs match the selected filters."}
          </p>
        </div>
      )}

      {!loading && !error && filteredPairs.length > 0 && (
        <>
          <div className="hidden md:block">
            <AtrBarChart pairs={filteredPairs} />
          </div>
          <div className="md:hidden">
            <AtrList pairs={filteredPairs} />
          </div>
        </>
      )}

      {!loading && !error && data && data.pairs.length > 0 && (
        <div className="border-t border-white/[0.06]">
          <div className="px-4 py-4 sm:px-6">
            <h2 className="font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
              All Instruments
            </h2>
          </div>
          <AtrTable pairs={filteredPairs} />
        </div>
      )}
    </div>
  );
}
