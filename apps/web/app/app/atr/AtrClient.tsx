"use client";

import { useMemo, useState } from "react";
import type { AtrZoneId } from "@/features/atr/types";
import type { ForexTier } from "@tradevantage/shared";
import { formatWibTime } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { TextTabs } from "@/components/ui/TextTabs";
import { ATR_ZONE_CONFIG, ATR_ZONES_ORDERED, GROUP_LABELS } from "@/features/atr/lib/zones";
import { useAtrData } from "@/features/atr/hooks/useAtrData";
import { AtrTable } from "@/features/atr/components/AtrTable";
import { ChipToggles, StateLine, ZoneToggles, flip } from "@/features/atr/components/FilterControls";

const GROUPS = ["major", "cross", "commodity", "index"];
const TIERS = [
  { id: "all", label: "All" },
  { id: "primary", label: "Primary" },
  { id: "secondary", label: "Secondary" },
  { id: "thirdliner", label: "Thirdliner" },
] as const;

export default function AtrClient() {
  const [activeTier, setActiveTier] = useState<ForexTier | "all">("all");
  const [activeZones, setActiveZones] = useState<Set<AtrZoneId>>(() => new Set(ATR_ZONES_ORDERED));
  const [activeGroups, setActiveGroups] = useState<Set<string>>(() => new Set(GROUPS));

  const { data, loading, error } = useAtrData();

  const filteredPairs = useMemo(() => {
    if (!data) return [];
    return data.pairs.filter(
      (p) => activeZones.has(p.zone) && activeGroups.has(p.group) && (activeTier === "all" || p.tier === activeTier),
    );
  }, [data, activeZones, activeGroups, activeTier]);

  const totalCount = data?.pairs.length ?? 0;
  const zones = ATR_ZONES_ORDERED.map((z) => {
    const c = ATR_ZONE_CONFIG[z];
    return {
      id: z,
      label: c.label,
      color: c.color,
      range: c.max === Infinity ? `${c.min}%+` : `${c.min} to ${c.max}%`,
      count: data?.pairs.filter((p) => p.zone === z).length ?? 0,
    };
  });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel
        title="Range used today"
        sub={
          <>
            Share of the 20-day ATR travelled, most stretched first.
            {data?.updatedAt && <span className="text-white/30"> Updated {formatWibTime(data.updatedAt)} WIB</span>}
          </>
        }
        action={<TextTabs options={TIERS} value={activeTier} onChange={setActiveTier} label="Tier" className="hidden sm:flex" />}
      >
        <TextTabs options={TIERS} value={activeTier} onChange={setActiveTier} label="Tier" className="mb-3 sm:hidden" />
        {loading ? (
          <StateLine>Computing ATR levels</StateLine>
        ) : error ? (
          <StateLine>{error}</StateLine>
        ) : filteredPairs.length === 0 ? (
          <StateLine>
            {totalCount === 0 ? "No ATR data yet. The worker syncs every 4 hours." : "No pairs match the selected filters."}
          </StateLine>
        ) : (
          <>
            <AtrTable pairs={filteredPairs} />
            <p className="mt-3 text-[12px] text-white/30">
              {filteredPairs.length} of {totalCount} pairs. Each dot is 5% of the daily ATR, the marked dot is 100%.
            </p>
          </>
        )}
      </Panel>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Zones" sub="Tap a zone to hide or show it">
          <ZoneToggles zones={zones} active={activeZones} onToggle={(z) => setActiveZones(flip(z))} label="ATR zones" />
        </Panel>
        <Panel title="Groups">
          <ChipToggles
            options={GROUPS.map((g) => ({ id: g, label: GROUP_LABELS[g] ?? g }))}
            active={activeGroups}
            onToggle={(g) => setActiveGroups(flip(g))}
            label="Instrument groups"
          />
        </Panel>
      </aside>
    </div>
  );
}
