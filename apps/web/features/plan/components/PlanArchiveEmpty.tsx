import type { HorizonFilter } from "@/features/plan/types";
import { cn } from "@/lib/cn";

type Props = {
  horizonFilter: HorizonFilter;
  onClear: () => void;
  className?: string;
};

export function PlanArchiveEmpty({
  horizonFilter,
  onClear,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mt-6 border border-gray-3 bg-gray-2/40 p-12 text-center",
        className
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-red-500">
        ● NULL TRANSMISSION
      </div>
      <div className="mt-3 font-display text-2xl text-white">
        No {horizonFilter} plans on record.
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
        The desk hasn't shipped a {horizonFilter} plan yet — or this horizon was
        filtered to an empty set.
      </div>
      <button
        onClick={onClear}
        className="mt-6 border border-brand/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
      >
        ✕ Show all plans
      </button>
    </div>
  );
}
