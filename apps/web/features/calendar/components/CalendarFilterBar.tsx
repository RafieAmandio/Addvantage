import { cn } from "@/lib/cn";
import { REGIONS, type ImpactFilter, type RegionFilter } from "@/features/calendar/types";
import { currencyOf, flagOf } from "@/features/calendar/lib/econ";
import { ImpactBars } from "@/features/calendar/components/EventBits";

type Props = {
  impactFilter: ImpactFilter;
  regionFilter: RegionFilter;
  filtersActive: boolean;
  onImpactChange: (v: ImpactFilter) => void;
  onRegionChange: (v: RegionFilter) => void;
  onReset: () => void;
  className?: string;
};

export function Chip({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
        className,
        on ? "border-white/50 bg-white/[0.08] text-white" : "border-white/[0.12] text-white/60 hover:border-white/25 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

const IMPACTS = ["high", "medium", "low"] as const;

/** Impact and currency chips. Tapping the active chip clears it. On a phone the row scrolls sideways. */
export function CalendarFilterBar({ impactFilter, regionFilter, filtersActive, onImpactChange, onRegionChange, onReset, className }: Props) {
  return (
    <div className={cn("-mx-5 flex items-center gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0", className)}>
      {IMPACTS.map((i) => (
        <Chip key={i} on={impactFilter === i} onClick={() => onImpactChange(impactFilter === i ? "all" : i)}>
          <ImpactBars impact={i} />
          <span className="capitalize">{i}</span>
        </Chip>
      ))}
      <span className="mx-1.5 h-4 w-px shrink-0 bg-white/10" aria-hidden />
      {REGIONS.map((r) => {
        const cur = currencyOf(r, "");
        return (
          <Chip key={r} on={regionFilter === r} onClick={() => onRegionChange(regionFilter === r ? "all" : r)}>
            <span aria-hidden className="text-[14px] leading-none">{flagOf(cur)}</span>
            {cur}
          </Chip>
        );
      })}
      {filtersActive && (
        <button
          type="button"
          onClick={onReset}
          className="ml-1 shrink-0 text-[13px] font-medium text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          Clear
        </button>
      )}
    </div>
  );
}
