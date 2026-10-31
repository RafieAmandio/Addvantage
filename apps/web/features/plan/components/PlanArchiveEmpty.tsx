import type { HorizonFilter } from "@/features/plan/types";
import { cn } from "@/lib/cn";

type Props = {
  horizonFilter: HorizonFilter;
  onClear: () => void;
  className?: string;
};

export function PlanArchiveEmpty({ horizonFilter, onClear, className }: Props) {
  return (
    <div className={cn("py-10 text-center", className)}>
      <p className="text-[17px] font-medium text-white">
        No {horizonFilter === "all" ? "" : `${horizonFilter} `}plans match.
      </p>
      <p className="mt-1 text-[14px] text-white/55">Try another horizon or clear the search.</p>
      <button
        onClick={onClear}
        className="mt-4 rounded-full border border-white/[0.14] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
      >
        Show all plans
      </button>
    </div>
  );
}
