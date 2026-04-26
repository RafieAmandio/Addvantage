"use client";

import {
  KIND_META,
  type SearchResult,
  type ResultKind,
} from "@/features/search/search";
import { SearchPaletteResultRow } from "./SearchPaletteResultRow";

interface SearchPaletteGroupProps {
  kind: ResultKind;
  items: SearchResult[];
  startIndex: number;
  activeIndex: number;
  query: string;
  onHover: (idx: number) => void;
  onCommit: (r: SearchResult) => void;
}

export function SearchPaletteGroup({
  kind,
  items,
  startIndex,
  activeIndex,
  query,
  onHover,
  onCommit,
}: SearchPaletteGroupProps) {
  return (
    <div className="border-b border-gray-3 last:border-b-0">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-3 bg-gray-2/95 px-5 py-2 backdrop-blur">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">
          <span>{KIND_META[kind].code}</span>
          <span className="h-px w-6 bg-brand/40" />
          <span>{KIND_META[kind].label}</span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          {items.length}
        </span>
      </div>
      {items.map((r, i) => {
        const idx = startIndex + i;
        return (
          <SearchPaletteResultRow
            key={`${r.kind}-${r.id}`}
            result={r}
            kind={kind}
            index={idx}
            active={idx === activeIndex}
            query={query}
            onHover={onHover}
            onCommit={onCommit}
          />
        );
      })}
    </div>
  );
}
