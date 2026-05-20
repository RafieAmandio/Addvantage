"use client";

import { useCallback, useMemo, useState } from "react";
import type { RsiZoneId } from "@/features/heatmap/types";
import { ZONES_ORDERED } from "@/features/heatmap/lib/zones";
import { useRsiData } from "@/features/heatmap/hooks/useRsiData";
import { RsiToolbar } from "@/features/heatmap/components/RsiToolbar";
import { RsiHeatmap } from "@/features/heatmap/components/RsiHeatmap";
import { RsiList } from "@/features/heatmap/components/RsiList";

export default function HeatmapClient() {
  const [interval, setChartInterval] = useState("4h");
  const [activeZones, setActiveZones] = useState<Set<RsiZoneId>>(
    () => new Set(ZONES_ORDERED),
  );

  const { data, loading, error } = useRsiData(interval);

  const toggleZone = useCallback((z: RsiZoneId) => {
    setActiveZones((prev) => {
      const next = new Set(prev);
      if (next.has(z)) next.delete(z);
      else next.add(z);
      return next;
    });
  }, []);

  const filteredPairs = useMemo(() => {
    if (!data) return [];
    return data.pairs.filter((p) => activeZones.has(p.zone));
  }, [data, activeZones]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-4 py-6 sm:px-6">
        <h1 className="font-mono text-lg font-bold text-white">
          Forex RSI Heatmap
        </h1>
        <p className="mt-1 text-xs text-white/30">
          14-period RSI across major pairs, crosses, commodities, and indices.
          Refreshed every 4 hours.
        </p>
      </div>

      {/* Toolbar */}
      <RsiToolbar
        interval={interval}
        onIntervalChange={setChartInterval}
        activeZones={activeZones}
        onToggleZone={toggleZone}
        pairCount={filteredPairs.length}
        totalCount={data?.pairs.length ?? 0}
        updatedAt={data?.updatedAt ?? null}
      />

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
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
              ? "No RSI data available yet. The worker syncs every 4 hours."
              : "No pairs match the selected filters."}
          </p>
        </div>
      )}

      {!loading && !error && filteredPairs.length > 0 && (
        <>
          {/* Desktop: SVG scatter chart */}
          <div className="hidden md:block">
            <RsiHeatmap pairs={filteredPairs} />
          </div>
          {/* Mobile: list view */}
          <div className="md:hidden">
            <RsiList pairs={filteredPairs} />
          </div>
        </>
      )}
    </div>
  );
}
