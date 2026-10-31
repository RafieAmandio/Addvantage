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

const btn =
  "rounded-full border border-white/[0.14] px-3 py-1 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";

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
  const short = variant === "month";
  return (
    <div className={cn("text-center", short && "max-w-md", className)}>
      <p className="text-[17px] font-medium text-white">{title}</p>
      <p className="mt-1 text-[14px] text-white/40">
        {filtersActive
          ? "Filters are excluding everything in this range."
          : "Nothing scheduled here. The desk does not invent releases to fill a screen."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {nearestBackward && (
          <button type="button" onClick={() => onJumpToNearest(-1)} className={btn}>
            ← {short ? "Previous event" : formatDayHeader(nearestBackward)}
          </button>
        )}
        {anchor !== TODAY_YMD && (
          <button type="button" onClick={onToday} className={btn}>
            Today
          </button>
        )}
        {nearestForward && (
          <button type="button" onClick={() => onJumpToNearest(1)} className={cn(btn, "border-transparent bg-brand text-black hover:bg-brand/90")}>
            {short ? "Next event" : formatDayHeader(nearestForward)} →
          </button>
        )}
        {filtersActive && (
          <button type="button" onClick={onResetFilters} className={cn(btn, "text-white/55 hover:text-down")}>
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
