"use client";

import { useMemo, useState } from "react";
import type { RsiZoneId } from "@/features/heatmap/types";
import type { ForexGroup } from "@tradevantage/shared";
import { formatWibTime } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { TextTabs } from "@/components/ui/TextTabs";
import { GROUP_LABELS, GROUPS_ORDERED, ZONE_CONFIG, ZONES_ORDERED } from "@/features/heatmap/lib/zones";
import { useRsiData, useRsiTableData } from "@/features/heatmap/hooks/useRsiData";
import { RsiRanked, RsiTable } from "@/features/heatmap/components/RsiTable";
import { ChipToggles, StateLine, ZoneToggles, flip } from "@/features/atr/components/FilterControls";

const TIMEFRAMES = [
  { id: "1h", label: "1H" },
  { id: "4h", label: "4H" },
  { id: "1d", label: "1D" },
] as const;

export default function HeatmapClient() {
  const [interval, setChartInterval] = useState<"1h" | "4h" | "1d">("4h");
  const [activeZones, setActiveZones] = useState<Set<RsiZoneId>>(() => new Set(ZONES_ORDERED));
  const [activeGroups, setActiveGroups] = useState<Set<ForexGroup>>(() => new Set(GROUPS_ORDERED));

  const chartData = useRsiData(interval);
  const tableData = useRsiTableData();

  const filteredPairs = useMemo(() => {
    if (!chartData.data) return [];
    return chartData.data.pairs.filter((p) => activeZones.has(p.zone) && activeGroups.has(p.group as ForexGroup));
  }, [chartData.data, activeZones, activeGroups]);

  const all = chartData.data?.pairs ?? [];
  const avg = all.length ? all.reduce((s, p) => s + p.rsi, 0) / all.length : null;
  const zones = ZONES_ORDERED.map((z) => {
    const c = ZONE_CONFIG[z];
    return {
      id: z,
      label: c.label,
      color: c.color,
      range: `${c.min} to ${c.max}`,
      count: all.filter((p) => p.zone === z).length,
    };
  });
  const tf = TIMEFRAMES.find((t) => t.id === interval)!.label;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <Panel
          title={`RSI ${tf}`}
          sub={
            <>
              14-period RSI, most overbought first.
              {chartData.data?.updatedAt && <span className="text-white/30"> Updated {formatWibTime(chartData.data.updatedAt)} WIB</span>}
            </>
          }
          action={<TextTabs options={TIMEFRAMES} value={interval} onChange={setChartInterval} label="Timeframe" />}
        >
          {chartData.loading ? (
            <StateLine>Scanning {tf} RSI</StateLine>
          ) : chartData.error ? (
            <StateLine>{chartData.error}</StateLine>
          ) : filteredPairs.length === 0 ? (
            <StateLine>
              {all.length === 0 ? "No RSI data yet. The worker syncs every 4 hours." : "No pairs match the selected filters."}
            </StateLine>
          ) : (
            <>
              <RsiRanked pairs={filteredPairs} />
              <p className="mt-3 text-[12px] text-white/30">
                {filteredPairs.length} of {all.length} pairs. Each dot is 5 RSI points, the tinted ends mark 30 and 70.
              </p>
            </>
          )}
        </Panel>

        {tableData.data && tableData.data.pairs.length > 0 && (
          <Panel title="All timeframes" sub="1H, 4H and 1D side by side. Sort by any column.">
            <RsiTable pairs={tableData.data.pairs} />
          </Panel>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Zones" sub="Tap a zone to hide or show it">
          {avg !== null && (
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">Average {tf}</span>
              <span className="font-num text-[28px] font-semibold leading-7 text-white">{avg.toFixed(1)}</span>
            </div>
          )}
          <ZoneToggles zones={zones} active={activeZones} onToggle={(z) => setActiveZones(flip(z))} label="RSI zones" />
        </Panel>
        <Panel title="Groups">
          <ChipToggles
            options={GROUPS_ORDERED.map((g) => ({ id: g, label: GROUP_LABELS[g] ?? g }))}
            active={activeGroups}
            onToggle={(g) => setActiveGroups(flip(g))}
            label="Instrument groups"
          />
        </Panel>
      </aside>
    </div>
  );
}
