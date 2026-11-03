import { cn } from "@/lib/cn";
import { TODAY_YMD, type ViewMode } from "@/features/calendar/types";
import { addDays, startOfWeek } from "@/features/calendar/lib/date";
import { stepAnchor } from "@/features/calendar/lib/view";
import { Chip } from "@/features/calendar/components/CalendarFilterBar";

type Props = {
  view: ViewMode;
  anchor: string;
  label: string;
  onViewChange: (v: ViewMode) => void;
  onAnchorChange: (ymd: string) => void;
  className?: string;
};

const arrow =
  "grid h-8 w-8 place-items-center rounded-full border border-white/[0.12] text-[14px] text-white/80 transition-colors hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";

/** Range presets (Today, This week, Next week, Month) with step arrows and the range label. */
export function CalendarToolbar({ view, anchor, label, onViewChange, onAnchorChange, className }: Props) {
  const week = startOfWeek(anchor);
  const thisWeek = startOfWeek(TODAY_YMD);
  const presets = [
    { id: "today", label: "Today", on: view === "day" && anchor === TODAY_YMD, go: () => { onViewChange("day"); onAnchorChange(TODAY_YMD); } },
    { id: "week", label: "This week", on: view === "week" && week === thisWeek, go: () => { onViewChange("week"); onAnchorChange(TODAY_YMD); } },
    { id: "next", label: "Next week", on: view === "week" && week === addDays(thisWeek, 7), go: () => { onViewChange("week"); onAnchorChange(addDays(thisWeek, 7)); } },
    { id: "month", label: "Month", on: view === "month", go: () => onViewChange("month"), className: "hidden sm:inline-flex" },
  ];
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Date range">
        {presets.map((p) => (
          <Chip key={p.id} on={p.on} onClick={p.go} className={"className" in p ? p.className : undefined}>
            {p.label}
          </Chip>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-white/70">{label}</span>
        <button type="button" onClick={() => onAnchorChange(stepAnchor(view, anchor, -1))} aria-label={`Previous ${view}`} className={arrow}>
          ←
        </button>
        <button type="button" onClick={() => onAnchorChange(stepAnchor(view, anchor, 1))} aria-label={`Next ${view}`} className={arrow}>
          →
        </button>
      </div>
    </div>
  );
}
