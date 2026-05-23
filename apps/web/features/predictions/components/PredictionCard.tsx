"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";
import { formatVolume, formatWeekRange, categoryIcon } from "../lib/format";
import { OutcomeRow } from "./OutcomeRow";
import type { PredictionCardData } from "../types";

function PredictionCardInner({
  data,
  onClick,
  className,
}: {
  data: PredictionCardData;
  onClick?: () => void;
  className?: string;
}) {
  const { tracked, outcomes, volume, marketCount, weekRange } = data;
  const top2 = outcomes.slice(0, 2);
  const rangeText = formatWeekRange(weekRange);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full text-left",
        "bg-gray border border-white/[0.06] p-4",
        "transition-colors duration-150",
        "hover:border-white/[0.12] hover:bg-gray-2",
        "focus-visible:outline-2 focus-visible:outline-brand",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center bg-white/[0.06] font-mono text-xs text-brand">
          {categoryIcon(tracked.category)}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest2 text-white/40">
          {tracked.label}
        </span>
      </div>

      <h3 className="mb-4 text-sm font-semibold leading-snug text-white">
        {tracked.eventTitle}
      </h3>

      <div className="space-y-2.5">
        {top2.map((o, i) => (
          <OutcomeRow key={i} outcome={o} />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3">
        <span className="font-mono text-[10px] text-white/30">
          {formatVolume(volume)} vol
        </span>
        <span className="font-mono text-[10px] text-white/30">
          {marketCount} markets
        </span>
      </div>

      {rangeText && (
        <p className="mt-1.5 text-[10px] text-white/25 font-mono">
          {rangeText}
        </p>
      )}
    </button>
  );
}

export const PredictionCard = memo(PredictionCardInner);
