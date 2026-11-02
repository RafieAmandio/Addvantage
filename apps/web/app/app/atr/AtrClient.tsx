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
import { ScatterTip, ZoneScatter } from "@/components/ui/ZoneScatter";
import { instrumentHref } from "@/features/atr/components/FilterControls";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
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

  const points = useMemo(
    () =>
      [...filteredPairs]
        .sort((a, b) => b.exhaustionPct - a.exhaustionPct)
        .map((p) => ({
          id: p.symbol,
          label: p.symbol.replace("/", ""),
          value: p.exhaustionPct,
          color: ATR_ZONE_CONFIG[p.zone].color,
          group: p.group,
          href: instrumentHref(p.symbol),
          shape: p.direction === "bullish" ? ("up" as const) : ("down" as const),
        })),
    [filteredPairs],
  );
  // ponytail: axis capped at 200%, anything beyond sits on the top edge (tooltip and table show the real number).
  const yMax = Math.min(200, Math.max(125, Math.ceil((Math.max(0, ...filteredPairs.map((p) => p.exhaustionPct)) + 5) / 25) * 25));

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
      <div className="min-w-0 space-y-4">
        <Panel
          title="Range used today"
          sub={
            <>
              Share of the 20-day ATR travelled today, grouped by market.
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
              <ZoneScatter
                ariaLabel="Daily ATR used by instrument"
                points={points}
                groups={GROUPS.map((g) => ({
                  id: g,
                  label: GROUP_LABELS[g] ?? g,
                }))}
                bands={ATR_ZONES_ORDERED.map((z) => ({
                  id: z,
                  ...ATR_ZONE_CONFIG[z],
                }))}
                yMin={0}
                yMax={yMax}
                ticks={Array.from({ length: yMax / 25 + 1 }, (_, i) => i * 25)}
                unit="%"
                refLines={[
                  {
                    value: 100,
                    label: "100% ATR",
                    color: "#EEEEEE",
                    strong: true,
                  },
                ]}
                renderTip={(id) => {
                  const p = filteredPairs.find((x) => x.symbol === id)!;
                  const c = ATR_ZONE_CONFIG[p.zone];
                  const bull = p.direction === "bullish";
                  return (
                    <ScatterTip
                      title={p.symbol.replace("/", "")}
                      color={c.color}
                      href={instrumentHref(p.symbol)}
                      rows={[
                        [
                          "Range used",
                          <span key="u">
                            {p.exhaustionPct.toFixed(1)}%
                          </span>,
                        ],
                        [
                          "Today",
                          <span key="d" className={bull ? "text-up" : "text-down"}>
                            {bull ? "▲ Up" : "▼ Down"}
                          </span>,
                        ],
                        ["Price", p.price !== null ? fmtPrice(p.price) : "n/a"],
                        ["ATR 20", fmtPrice(p.atr)],
                        ["Upper", fmtPrice(p.upperLevel)],
                        ["Lower", fmtPrice(p.lowerLevel)],
                      ]}
                    />
                  );
                }}
              />
              <p className="mt-3 text-[12px] text-white/40">
                {filteredPairs.length} of {totalCount} pairs. ▲ up today, ▼ down today.<span className="sm:hidden"> Swipe the chart sideways for every group.</span> Above the white line the day has travelled more than
                its 20-day ATR.
              </p>
            </>
          )}
        </Panel>

        {filteredPairs.length > 0 && (
          <Panel title="Levels" sub="Exact numbers for the pairs shown. Sort by any column.">
            <AtrTable pairs={filteredPairs} />
          </Panel>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Zones" sub="Tap a zone to hide or show it">
          <ZoneToggles zones={zones} active={activeZones} onToggle={(z) => setActiveZones(flip(z))} label="ATR zones" />
        </Panel>
        <Panel title="Groups">
          <ChipToggles
            options={GROUPS.map((g) => ({
              id: g,
              label: GROUP_LABELS[g] ?? g,
            }))}
            active={activeGroups}
            onToggle={(g) => setActiveGroups(flip(g))}
            label="Instrument groups"
          />
        </Panel>
      </aside>
    </div>
  );
}
