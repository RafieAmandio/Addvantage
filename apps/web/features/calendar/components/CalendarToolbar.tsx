import { cn } from "@/lib/cn";
import { TextTabs } from "@/components/ui/TextTabs";
import { TODAY_YMD, type ViewMode } from "@/features/calendar/types";
import { stepAnchor } from "@/features/calendar/lib/view";

type Props = {
  view: ViewMode;
  anchor: string;
  eventCount: number;
  onViewChange: (v: ViewMode) => void;
  onAnchorChange: (ymd: string) => void;
  className?: string;
};

const VIEWS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
] as const;

const btn =
  "rounded-full border border-white/[0.14] px-3 py-1 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";

/** View tabs on the left, step and today controls on the right. */
export function CalendarToolbar({ view, anchor, onViewChange, onAnchorChange, className }: Props) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <TextTabs options={VIEWS} value={view} onChange={onViewChange} label="Calendar view" className="text-[15px]" />
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onAnchorChange(stepAnchor(view, anchor, -1))} aria-label={`Previous ${view}`} className={btn}>
          ←
        </button>
        <button
          type="button"
          onClick={() => onAnchorChange(TODAY_YMD)}
          disabled={anchor === TODAY_YMD}
          className={cn(btn, anchor === TODAY_YMD && "cursor-default text-white/30 hover:bg-transparent")}
        >
          Today
        </button>
        <button type="button" onClick={() => onAnchorChange(stepAnchor(view, anchor, 1))} aria-label={`Next ${view}`} className={btn}>
          →
        </button>
      </div>
    </div>
  );
}
