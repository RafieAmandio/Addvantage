"use client";

import { TextTabs } from "@/components/ui/TextTabs";
import type { SortMode } from "@/features/watchlist/types";

interface Props {
  sortMode: SortMode;
  onSortModeChange: (v: SortMode) => void;
  /** Kept for callers; the panel title carries the count now. */
  label?: string;
}

const OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: "pinned", label: "Pin order" },
  { id: "news", label: "News" },
  { id: "r", label: "R" },
  { id: "alpha", label: "A to Z" },
];

export function WatchlistSortBar({ sortMode, onSortModeChange }: Props) {
  return <TextTabs options={OPTIONS} value={sortMode} onChange={onSortModeChange} label="Sort" />;
}
