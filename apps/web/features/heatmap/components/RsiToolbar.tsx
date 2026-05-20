"use client";

import { cn } from "@/lib/cn";
import type { RsiZoneId, ViewMode } from "../types";
import { ZONE_CONFIG, ZONES_ORDERED } from "../lib/zones";

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
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  pairCount: number;
  totalCount: number;
  updatedAt: string | null;
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="4" cy="6" r="2" /><circle cx="10" cy="4" r="2" /><circle cx="7" cy="10" r="2" />
    </svg>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="1" y="1" width="12" height="12" rx="1" />
      <path d="M1 5h12M1 9h12M5 1v12" />
    </svg>
  );
}

export function RsiToolbar({
  interval,
  onIntervalChange,
  activeZones,
  onToggleZone,
  viewMode,
  onViewModeChange,
  pairCount,
  totalCount,
  updatedAt,
}: RsiToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-6">
      {/* View mode toggle */}
      <div className="flex items-center rounded-lg bg-white/[0.04] p-0.5">
        <button
          onClick={() => onViewModeChange("chart")}
          className={cn(
            "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
            viewMode === "chart" ? "bg-brand text-black" : "text-white/40 hover:text-white/70",
          )}
        >
          <ChartIcon />
          <span className="hidden sm:inline">Chart</span>
        </button>
        <button
          onClick={() => onViewModeChange("table")}
          className={cn(
            "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
            viewMode === "table" ? "bg-brand text-black" : "text-white/40 hover:text-white/70",
          )}
        >
          <TableIcon />
          <span className="hidden sm:inline">Table</span>
        </button>
      </div>

      {/* Timeframe selector — only in chart mode */}
      {viewMode === "chart" && (
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
      )}

      {/* Zone filter toggles — only in chart mode */}
      {viewMode === "chart" && (
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
      )}

      {/* Meta */}
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
