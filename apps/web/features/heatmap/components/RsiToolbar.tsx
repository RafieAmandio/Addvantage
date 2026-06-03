"use client";

import { cn } from "@/lib/cn";
import type { RsiZoneId } from "../types";
import type { ForexGroup } from "@tradevantage/shared";
import { ZONE_CONFIG, ZONES_ORDERED, GROUP_LABELS, GROUPS_ORDERED, GROUP_COLORS } from "../lib/zones";

const TIMEFRAMES = [
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
];

interface RsiToolbarProps {
  interval: string;
  onIntervalChange: (v: string) => void;
  activeZones: Set<RsiZoneId>;
  onToggleZone: (z: RsiZoneId) => void;
  activeGroups: Set<ForexGroup>;
  onToggleGroup: (g: ForexGroup) => void;
  pairCount: number;
  totalCount: number;
  updatedAt: string | null;
}

export function RsiToolbar({
  interval,
  onIntervalChange,
  activeZones,
  onToggleZone,
  activeGroups,
  onToggleGroup,
  pairCount,
  totalCount,
  updatedAt,
}: RsiToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-6">
      <div className="flex items-center rounded-lg bg-white/[0.04] p-0.5">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => onIntervalChange(tf.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              interval === tf.value
                ? "bg-brand text-black"
                : "text-white/40 hover:text-white/70",
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        {ZONES_ORDERED.map((z) => {
          const cfg = ZONE_CONFIG[z];
          const active = activeZones.has(z);
          return (
            <button
              key={z}
              onClick={() => onToggleZone(z)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide transition-all",
                active ? "bg-white/[0.06] text-white/80" : "text-white/20 hover:text-white/40",
              )}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: active ? cfg.color : "rgba(255,255,255,0.1)" }}
              />
              {cfg.label}
            </button>
          );
        })}
      </div>

      <span className="hidden h-4 w-px bg-white/10 sm:block" />

      <div className="flex items-center gap-1.5">
        {GROUPS_ORDERED.map((g) => {
          const active = activeGroups.has(g);
          return (
            <button
              key={g}
              onClick={() => onToggleGroup(g)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide transition-all",
                active ? "bg-white/[0.06] text-white/80" : "text-white/20 hover:text-white/40",
              )}
              style={active ? { color: GROUP_COLORS[g] } : undefined}
            >
              {GROUP_LABELS[g]}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-3 text-[11px] text-white/30">
        <span>
          {pairCount === totalCount ? `${totalCount} pairs` : `${pairCount} of ${totalCount}`}
        </span>
        {updatedAt && (
          <span title={updatedAt}>
            Updated {new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}
