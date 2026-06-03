"use client";

import { useCallback, useMemo, useState } from "react";
import type { RsiZoneId } from "@/features/heatmap/types";
import type { ForexGroup } from "@tradevantage/shared";
import { ZONES_ORDERED } from "@/features/heatmap/lib/zones";
import { GROUPS_ORDERED } from "@/features/heatmap/lib/zones";
import { useRsiData, useRsiTableData } from "@/features/heatmap/hooks/useRsiData";
import { RsiToolbar } from "@/features/heatmap/components/RsiToolbar";
import { RsiHeatmap } from "@/features/heatmap/components/RsiHeatmap";
import { RsiList } from "@/features/heatmap/components/RsiList";
import { RsiTable } from "@/features/heatmap/components/RsiTable";

export default function HeatmapClient() {
  const [interval, setChartInterval] = useState("4h");
  const [activeZones, setActiveZones] = useState<Set<RsiZoneId>>(
    () => new Set(ZONES_ORDERED),
  );
  const [activeGroups, setActiveGroups] = useState<Set<ForexGroup>>(
    () => new Set(GROUPS_ORDERED),
  );

  const chartData = useRsiData(interval);
  const tableData = useRsiTableData();

  const toggleZone = useCallback((z: RsiZoneId) => {
    setActiveZones((prev) => {
      const next = new Set(prev);
      if (next.has(z)) next.delete(z);
      else next.add(z);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((g: ForexGroup) => {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }, []);

  const filteredPairs = useMemo(() => {
    if (!chartData.data) return [];
    return chartData.data.pairs.filter(
      (p) => activeZones.has(p.zone) && activeGroups.has(p.group as ForexGroup),
    );
  }, [chartData.data, activeZones, activeGroups]);

  const totalCount = chartData.data?.pairs.length ?? 0;

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/[0.06] px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-lg font-bold text-white">
            Forex RSI Heatmap
          </h1>
          {!chartData.loading && !chartData.error && totalCount > 0 && (
            <span className="flex items-center gap-1.5 rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-white/30">
              <span className="led" aria-hidden />
              {totalCount} instruments
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-white/30">
          14-period RSI across major pairs, crosses, commodities, and indices.
          Refreshed every 4 hours.
        </p>
      </div>

      <RsiToolbar
        interval={interval}
        onIntervalChange={setChartInterval}
        activeZones={activeZones}
        onToggleZone={toggleZone}
        activeGroups={activeGroups}
        onToggleGroup={toggleGroup}
        pairCount={filteredPairs.length}
        totalCount={totalCount}
        updatedAt={chartData.data?.updatedAt ?? null}
      />

      {/* Scatter chart */}
      {chartData.loading && (
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-brand">
            <span className="led" aria-hidden />
            Scanning {interval} frequency
          </div>
        </div>
      )}

      {chartData.error && (
        <div className="px-4 py-12 text-center text-sm text-white/40 sm:px-6">
          {chartData.error}
        </div>
      )}

      {!chartData.loading && !chartData.error && filteredPairs.length === 0 && (
        <div className="px-4 py-20 text-center sm:px-6">
          <p className="text-sm text-white/30">
            {chartData.data && chartData.data.pairs.length === 0
              ? "No RSI data available yet. The worker syncs every 4 hours."
              : "No pairs match the selected filters."}
          </p>
        </div>
      )}

      {!chartData.loading && !chartData.error && filteredPairs.length > 0 && (
        <>
          <div className="hidden md:block">
            <RsiHeatmap pairs={filteredPairs} />
          </div>
          <div className="md:hidden">
            <RsiList pairs={filteredPairs} />
          </div>
        </>
      )}

      {/* Table below chart */}
      {!tableData.loading && !tableData.error && tableData.data && tableData.data.pairs.length > 0 && (
        <div className="border-t border-white/[0.06]">
          <div className="px-4 py-4 sm:px-6">
            <h2 className="font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
              All Instruments
            </h2>
          </div>
          <RsiTable pairs={tableData.data.pairs} />
        </div>
      )}
    </div>
  );
}
