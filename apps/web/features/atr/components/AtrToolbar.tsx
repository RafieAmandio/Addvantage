"use client";

import { cn } from "@/lib/cn";
import type { AtrZoneId } from "../types";
import { ATR_ZONE_CONFIG, ATR_ZONES_ORDERED, GROUP_LABELS } from "../lib/zones";
import type { ForexGroup, ForexTier } from "@tradevantage/shared";

const GROUPS: ForexGroup[] = ["major", "cross", "commodity", "exotic", "index"];

const TIER_TABS: { value: ForexTier | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "thirdliner", label: "Thirdliner" },
];

interface AtrToolbarProps {
  activeTier: ForexTier | "all";
  onTierChange: (t: ForexTier | "all") => void;
  activeZones: Set<AtrZoneId>;
  onToggleZone: (z: AtrZoneId) => void;
  activeGroups: Set<string>;
  onToggleGroup: (g: string) => void;
  pairCount: number;
  totalCount: number;
  exceededCount: number;
  updatedAt: string | null;
}

export function AtrToolbar({
  activeTier,
  onTierChange,
  activeZones,
  onToggleZone,
  activeGroups,
  onToggleGroup,
  pairCount,
  totalCount,
  exceededCount,
  updatedAt,
}: AtrToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-6">
      {/* Tier tabs */}
      <div className="flex items-center rounded-lg bg-white/[0.04] p-0.5">
        {TIER_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => onTierChange(t.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              activeTier === t.value
                ? "bg-brand text-black"
                : "text-white/40 hover:text-white/70",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Zone filters */}
      <div className="flex items-center gap-1.5">
        {ATR_ZONES_ORDERED.map((z) => {
          const cfg = ATR_ZONE_CONFIG[z];
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

      {/* Group filters */}
      <div className="hidden items-center gap-1 sm:flex">
        <span className="mr-1 text-[9px] text-white/15">|</span>
        {GROUPS.map((g) => {
          const active = activeGroups.has(g);
          return (
            <button
              key={g}
              onClick={() => onToggleGroup(g)}
              className={cn(
                "rounded-md px-1.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-all",
                active ? "text-white/60" : "text-white/15 hover:text-white/30",
              )}
            >
              {GROUP_LABELS[g]}
            </button>
          );
        })}
      </div>

      {/* Exceeded badge + counts */}
      <div className="ml-auto flex items-center gap-3 text-[11px] text-white/30">
        {exceededCount > 0 && (
          <span className="flex items-center gap-1.5 rounded bg-[#FF6B35]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#FF6B35]">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#FF6B35", boxShadow: "0 0 6px rgba(255,107,53,0.6)" }}
            />
            {exceededCount} EXCEEDED
          </span>
        )}
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
