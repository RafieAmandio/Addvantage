"use client";

import { cn, formatWibTime } from "@/lib/cn";
import type { ForexTier } from "@tradevantage/shared";

const TIER_TABS: { value: ForexTier | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "thirdliner", label: "Thirdliner" },
];

const STATUS_TABS: { value: "all" | "active" | "filled"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "filled", label: "Filled" },
];

interface GapToolbarProps {
  activeTier: ForexTier | "all";
  onTierChange: (t: ForexTier | "all") => void;
  activeStatus: "all" | "active" | "filled";
  onStatusChange: (s: "all" | "active" | "filled") => void;
  pairCount: number;
  totalCount: number;
  updatedAt: string | null;
}

export function GapToolbar({
  activeTier,
  onTierChange,
  activeStatus,
  onStatusChange,
  pairCount,
  totalCount,
  updatedAt,
}: GapToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-6">
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

      <div className="flex items-center rounded-lg bg-white/[0.04] p-0.5">
        {STATUS_TABS.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              activeStatus === s.value
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3 text-[11px] text-white/30">
        <span>
          {pairCount === totalCount ? `${totalCount} gaps` : `${pairCount} of ${totalCount}`}
        </span>
        {updatedAt && (
          <span title={updatedAt}>
            Updated {formatWibTime(updatedAt)} WIB
          </span>
        )}
      </div>
    </div>
  );
}
