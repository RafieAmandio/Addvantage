"use client";

import {
  KIND_META,
  type SearchResult,
  type ResultKind,
} from "@/features/search/search";
import { Highlight } from "@/components/ui/Highlight";
import { cn } from "@/lib/cn";

interface SearchPaletteResultRowProps {
  result: SearchResult;
  kind: ResultKind;
  index: number;
  active: boolean;
  query: string;
  onHover: () => void;
  onClick: () => void;
}

export function SearchPaletteResultRow({
  result,
  kind,
  index,
  active,
  query,
  onHover,
  onClick,
}: SearchPaletteResultRowProps) {
  return (
    <button
      data-result-index={index}
      onMouseEnter={onHover}
      onClick={onClick}
      className={cn(
        "block w-full border-b border-ink-3 px-5 py-4 text-left transition-colors",
        active
          ? "border-l-2 border-l-lime bg-lime/10"
          : "border-l-2 border-l-transparent bg-ink hover:bg-ink-2",
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
              {result.id}
            </span>
            {result.author && (
              <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                · BY {result.author.toUpperCase()}
              </span>
            )}
          </div>
          <div className="mt-1 truncate font-display text-lg text-paper">
            <Highlight text={result.title} query={query} />
          </div>
          <div className="mt-1 line-clamp-2 text-sm text-paper/60">
            <Highlight text={result.snippet} query={query} />
          </div>
          {result.tags && result.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="font-mono text-[9px] uppercase tracking-widest2 text-lime/60"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="hidden shrink-0 text-right font-mono text-[9px] uppercase tracking-widest2 text-paper/40 sm:block">
          <div>{KIND_META[kind].label}</div>
          {result.meta && <div className="mt-1">{result.meta}</div>}
        </div>
      </div>
    </button>
  );
}
