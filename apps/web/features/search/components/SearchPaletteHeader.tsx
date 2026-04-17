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
    <div className="border-b border-ink-3 bg-ink-2/80">
      <div className="flex items-center gap-3 px-5 py-4">
        <SearchPaletteIcon />
        <input
          ref={ref}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search news, plans, primers, channels, hashtags…"
          className="flex-1 bg-transparent font-display text-2xl text-paper placeholder:text-paper/30 outline-none"
        />
        <button
          onClick={onClose}
          aria-label="Close search"
          className="border border-ink-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/50 hover:border-lime hover:text-lime"
        >
          esc
        </button>
      </div>
      <div className="flex items-center justify-between border-t border-ink-3 px-5 py-2 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
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
