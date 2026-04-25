"use client";

import { forwardRef } from "react";
import { SearchPaletteIcon } from "./SearchPaletteIcon";

interface SearchPaletteHeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClose: () => void;
  resultCount: number;
  channelCount: number;
}

export const SearchPaletteHeader = forwardRef<
  HTMLInputElement,
  SearchPaletteHeaderProps
>(function SearchPaletteHeader(
  { query, onQueryChange, onKeyDown, onClose, resultCount, channelCount },
  ref,
) {
  return (
    <div className="border-b border-gray-3 bg-gray-2/80">
      <div className="flex items-center gap-3 px-5 py-4">
        <SearchPaletteIcon />
        <input
          ref={ref}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search news, plans, primers, channels, hashtags…"
          className="flex-1 bg-transparent font-display text-2xl text-white placeholder:text-white/30 outline-none"
        />
        <button
          onClick={onClose}
          aria-label="Close search"
          className="border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/50 hover:border-brand hover:text-brand"
        >
          esc
        </button>
      </div>
      <div className="flex items-center justify-between border-t border-gray-3 px-5 py-2 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
        <span>
          {query
            ? `${resultCount} ${resultCount === 1 ? "result" : "results"} across ${channelCount} ${channelCount === 1 ? "channel" : "channels"}`
            : "● TRANSMISSION SEARCH · OPERATOR EYES ONLY"}
        </span>
        <span className="hidden sm:flex items-center gap-3">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </span>
      </div>
    </div>
  );
});
