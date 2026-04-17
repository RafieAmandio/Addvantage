"use client";

import { cn } from "@/lib/cn";

interface Props {
  onResetFilter: () => void;
  className?: string;
}

export function NotificationEmpty({ onResetFilter, className }: Props) {
  return (
    <div className={cn("p-8 text-center", className)}>
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
        ● NOTHING IN THIS FILTER
      </div>
      <button
        onClick={onResetFilter}
        className="mt-3 border border-lime/60 px-3 py-1 font-mono text-[9px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
      >
        ← Show all
      </button>
    </div>
  );
}
