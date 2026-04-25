import { cn } from "@/lib/cn";
import {
  REGIONS,
  type ImpactFilter,
  type RegionFilter,
} from "@/features/calendar/types";
import { FilterChips } from "@/features/calendar/components/FilterChips";

type Props = {
  impactFilter: ImpactFilter;
  regionFilter: RegionFilter;
  filtersActive: boolean;
  onImpactChange: (v: ImpactFilter) => void;
  onRegionChange: (v: RegionFilter) => void;
  onReset: () => void;
  className?: string;
};

export function CalendarFilterBar({
  impactFilter,
  regionFilter,
  filtersActive,
  onImpactChange,
  onRegionChange,
  onReset,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mb-6 grid grid-cols-1 gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          Impact
        </span>
        <FilterChips
          options={[
            { value: "all", label: "All" },
            { value: "high", label: "High" },
            { value: "medium", label: "Mod" },
            { value: "low", label: "Low" },
          ]}
          value={impactFilter}
          onChange={(v) => onImpactChange(v as ImpactFilter)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          Region
        </span>
        <FilterChips
          options={[
            { value: "all", label: "All" },
            ...REGIONS.map((r) => ({ value: r, label: r })),
          ]}
          value={regionFilter}
          onChange={(v) => onRegionChange(v as RegionFilter)}
        />
      </div>

      <div className="flex justify-end">
        {filtersActive && (
          <button
            onClick={onReset}
            className="border border-gray-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60 hover:border-blood hover:text-red-500"
          >
            ✕ Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
