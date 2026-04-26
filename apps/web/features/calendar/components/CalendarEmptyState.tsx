import { cn } from "@/lib/cn";
import { TODAY_YMD } from "@/features/calendar/types";
import { formatDayHeader } from "@/features/calendar/lib/format";

type Props = {
  variant: "month" | "table";
  title: string;
  filtersActive: boolean;
  nearestBackward: string | null;
  nearestForward: string | null;
  anchor: string;
  onJumpToNearest: (dir: 1 | -1) => void;
  onToday: () => void;
  onResetFilters: () => void;
  className?: string;
};

export function CalendarEmptyState({
  variant,
  title,
  filtersActive,
  nearestBackward,
  nearestForward,
  anchor,
  onJumpToNearest,
  onToday,
  onResetFilters,
  className,
}: Props) {
  const isMonth = variant === "month";
  const size = isMonth ? "text-[9px]" : "text-[10px]";
  const bodySize = isMonth ? "text-2xl" : "text-2xl";
  const gap = isMonth ? "gap-2" : "gap-3";
  const btnPad = "px-3 py-1.5";

  return (
    <div className={cn(isMonth ? "max-w-md text-center" : "text-center", className)}>
      <div
        className={cn(
          "font-mono uppercase tracking-widest2 text-blood-bright",
          isMonth ? "text-[10px]" : "text-[10px]"
        )}
      >
        ● NULL TRANSMISSION
      </div>
      <div className={cn("mt-3 font-display text-white", bodySize)}>
        {title}
      </div>
      <div
        className={cn(
          "mt-2 font-mono uppercase tracking-widest2 text-white/40",
          "text-[10px]"
        )}
      >
        {isMonth
          ? filtersActive
            ? "Filters are excluding everything in this month."
            : "The desk hasn't published anything in this window."
          : filtersActive
          ? "Filters are excluding everything in this range."
          : "Try a different range — the desk doesn't fabricate releases to fill a screen."}
      </div>
      <div className={cn("mt-5 flex flex-wrap justify-center", gap)}>
        {nearestBackward && (
          <button
            onClick={() => onJumpToNearest(-1)}
            className={cn(
              "border border-brand/60 font-mono uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black",
              btnPad,
              size
            )}
          >
            ← Prev event{!isMonth && ` · ${formatDayHeader(nearestBackward)}`}
          </button>
        )}
        <button
          onClick={onToday}
          disabled={anchor === TODAY_YMD}
          className={cn(
            "border font-mono uppercase tracking-widest2",
            btnPad,
            size,
            anchor === TODAY_YMD
              ? "cursor-default border-gray-3 text-white/30"
              : "border-brand/60 text-brand hover:bg-brand hover:text-black"
          )}
        >
          Today
        </button>
        {nearestForward && (
          <button
            onClick={() => onJumpToNearest(1)}
            className={cn(
              "border border-brand/60 font-mono uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black",
              btnPad,
              size
            )}
          >
            {isMonth
              ? "Next event →"
              : `Next event · ${formatDayHeader(nearestForward!)} →`}
          </button>
        )}
        {filtersActive && (
          <button
            onClick={onResetFilters}
            className={cn(
              "border border-gray-3 font-mono uppercase tracking-widest2 text-white/60 hover:border-brand hover:text-brand",
              btnPad,
              size
            )}
          >
            ✕ Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
