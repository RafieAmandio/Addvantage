import { cn } from "@/lib/cn";
import { DEMO_TODAY_YMD, type ViewMode } from "@/features/calendar/types";
import { rangeLabel, stepAnchor } from "@/features/calendar/lib/view";

type Props = {
  view: ViewMode;
  anchor: string;
  eventCount: number;
  onViewChange: (v: ViewMode) => void;
  onAnchorChange: (ymd: string) => void;
  className?: string;
};

export function CalendarToolbar({
  view,
  anchor,
  eventCount,
  onViewChange,
  onAnchorChange,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center",
        className
      )}
    >
      {/* View selector */}
      <div
        className="flex gap-px bg-gray-3"
        role="tablist"
        aria-label="Calendar view"
      >
        {(["day", "week", "month"] as const).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            role="tab"
            aria-selected={view === v}
            className={cn(
              "px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 transition-colors",
              view === v
                ? "bg-lime text-ink"
                : "bg-gray-2 text-paper/60 hover:bg-gray-2 hover:text-paper"
            )}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Date stepper */}
      <div className="flex items-center justify-center gap-2 lg:gap-3">
        <button
          onClick={() => onAnchorChange(stepAnchor(view, anchor, -1))}
          aria-label={`Previous ${view}`}
          className="border border-gray-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-brand hover:text-brand"
        >
          ←
        </button>
        <div className="min-w-[180px] border border-lime/40 bg-gray-2/40 px-4 py-2 text-center">
          <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
            {view === "day" ? "Day" : view === "week" ? "Week" : "Month"}
          </div>
          <div className="font-display text-base text-lime">
            {rangeLabel(view, anchor)}
          </div>
        </div>
        <button
          onClick={() => onAnchorChange(stepAnchor(view, anchor, 1))}
          aria-label={`Next ${view}`}
          className="border border-gray-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-brand hover:text-brand"
        >
          →
        </button>
        <button
          onClick={() => onAnchorChange(DEMO_TODAY_YMD)}
          disabled={anchor === DEMO_TODAY_YMD}
          className={cn(
            "ml-2 border px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 transition-colors",
            anchor === DEMO_TODAY_YMD
              ? "cursor-default border-gray-3 text-paper/30"
              : "border-lime/60 text-lime hover:bg-brand hover:text-ink"
          )}
        >
          Today
        </button>
      </div>

      {/* Counts */}
      <div className="flex items-center justify-end gap-3 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
        <span className="text-lime">{eventCount}</span>
        <span>events in view</span>
      </div>
    </div>
  );
}
