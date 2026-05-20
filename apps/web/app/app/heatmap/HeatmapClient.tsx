"use client";

import { useCallback, useMemo, useState } from "react";
import type { RsiZoneId, ViewMode } from "@/features/heatmap/types";
import { ZONES_ORDERED } from "@/features/heatmap/lib/zones";
import { useRsiData, useRsiTableData } from "@/features/heatmap/hooks/useRsiData";
import { RsiToolbar } from "@/features/heatmap/components/RsiToolbar";
import { RsiHeatmap } from "@/features/heatmap/components/RsiHeatmap";
import { RsiList } from "@/features/heatmap/components/RsiList";
import { RsiTable } from "@/features/heatmap/components/RsiTable";

export default function HeatmapClient() {
  const [interval, setChartInterval] = useState("4h");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeZones, setActiveZones] = useState<Set<RsiZoneId>>(
    () => new Set(ZONES_ORDERED),
  );

  const isTable = viewMode === "table";
  const chartData = useRsiData(interval, !isTable);
  const tableData = useRsiTableData(isTable);
  const loading = isTable ? tableData.loading : chartData.loading;
  const error = isTable ? tableData.error : chartData.error;

  const toggleZone = useCallback((z: RsiZoneId) => {
    setActiveZones((prev) => {
      const next = new Set(prev);
      if (next.has(z)) next.delete(z);
      else next.add(z);
      return next;
    });
  }, []);

  const filteredPairs = useMemo(() => {
    if (!chartData.data) return [];
    return chartData.data.pairs.filter((p) => activeZones.has(p.zone));
  }, [chartData.data, activeZones]);

  const updatedAt = isTable ? tableData.data?.updatedAt : chartData.data?.updatedAt;
  const totalCount = isTable
    ? (tableData.data?.pairs.length ?? 0)
    : (chartData.data?.pairs.length ?? 0);
  const visibleCount = isTable
    ? (tableData.data?.pairs.length ?? 0)
    : filteredPairs.length;

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/[0.06] px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-lg font-bold text-white">
            Forex RSI Heatmap
          </h1>
          {!loading && !error && totalCount > 0 && (
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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        pairCount={visibleCount}
        totalCount={totalCount}
        updatedAt={updatedAt ?? null}
      />

      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-brand">
            <span className="led" aria-hidden />
            Scanning {isTable ? "all frequencies" : `${interval} frequency`}
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-12 text-center text-sm text-white/40 sm:px-6">
          {error}
        </div>
      )}

      {!loading && !error && isTable && tableData.data && (
        <RsiTable pairs={tableData.data.pairs} />
      )}

      {!loading && !error && !isTable && filteredPairs.length === 0 && (
        <div className="px-4 py-20 text-center sm:px-6">
          <p className="text-sm text-white/30">
            {chartData.data && chartData.data.pairs.length === 0
              ? "No RSI data available yet. The worker syncs every 4 hours."
              : "No pairs match the selected filters."}
          </p>
        </div>
      )}

      {!loading && !error && !isTable && filteredPairs.length > 0 && (
        <>
          <div className="hidden md:block">
            <RsiHeatmap pairs={filteredPairs} />
          </div>
          <div className="md:hidden">
            <RsiList pairs={filteredPairs} />
          </div>
        </>
      )}
    </div>
  );
}
