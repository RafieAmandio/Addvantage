import { cn } from "@/lib/cn";
import { TextTabs } from "@/components/ui/TextTabs";
import { REGIONS, type ImpactFilter, type RegionFilter } from "@/features/calendar/types";

type Props = {
  impactFilter: ImpactFilter;
  regionFilter: RegionFilter;
  filtersActive: boolean;
  onImpactChange: (v: ImpactFilter) => void;
  onRegionChange: (v: RegionFilter) => void;
  onReset: () => void;
  className?: string;
};

const IMPACTS = [
  { id: "all", label: "All impact" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
] as const;

const REGION_OPTS = [
  { id: "all" as RegionFilter, label: "All regions" },
  ...REGIONS.map((r) => ({ id: r as RegionFilter, label: r === "GLOBAL" ? "Other" : r })),
];

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
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-2", className)}>
      <TextTabs options={IMPACTS} value={impactFilter} onChange={onImpactChange} label="Filter by impact" />
      <span className="hidden h-3 w-px bg-white/10 sm:block" aria-hidden />
      <TextTabs options={REGION_OPTS} value={regionFilter} onChange={onRegionChange} label="Filter by region" />
      {filtersActive && (
        <button
          type="button"
          onClick={onReset}
          className="ml-auto text-[13px] font-medium text-white/40 transition-colors hover:text-down focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
