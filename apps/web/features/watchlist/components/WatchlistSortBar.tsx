import { SectionNumber } from "@/components/ui/Marker";
import { cn } from "@/lib/cn";
import type { SortMode } from "@/features/watchlist/types";

interface Props {
  sortMode: SortMode;
  onSortModeChange: (v: SortMode) => void;
  label: string;
}

const OPTIONS: Array<{ v: SortMode; label: string }> = [
  { v: "pinned", label: "Pin order" },
  { v: "news", label: "News" },
  { v: "r", label: "R" },
  { v: "alpha", label: "A→Z" },
];

export function WatchlistSortBar({ sortMode, onSortModeChange, label }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <SectionNumber n="—" label={label} />
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
          Sort
        </span>
        <div className="flex flex-wrap gap-px bg-gray-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.v}
              onClick={() => onSortModeChange(opt.v)}
              className={cn(
                "px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 transition-colors",
                sortMode === opt.v
                  ? "bg-lime text-ink"
                  : "bg-gray-2 text-paper/60 hover:text-paper"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
