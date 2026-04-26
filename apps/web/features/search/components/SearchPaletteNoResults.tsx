"use client";

import { SEARCH_SUGGESTIONS } from "@/features/search/lib/suggestions";

interface SearchPaletteNoResultsProps {
  query: string;
  recent: string[];
  onPick: (q: string) => void;
}

export function SearchPaletteNoResults({
  query,
  recent,
  onPick,
}: SearchPaletteNoResultsProps) {
  return (
    <div className="p-10 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
        ● NULL TRANSMISSION
      </div>
      <div className="mt-3 font-display text-2xl text-white">
        Nothing matches &quot;{query}&quot;.
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
        The desk doesn&apos;t fabricate results to fill a screen.
      </div>

      <div className="mx-auto mt-8 max-w-md border-t border-gray-3 pt-6">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
          ● Try one of these instead
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {SEARCH_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="border border-brand/30 bg-brand/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              {s}
            </button>
          ))}
        </div>
        {recent.length > 0 && (
          <>
            <div className="mt-6 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
              ● Or your recent searches
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {recent.map((q) => (
                <button
                  key={q}
                  onClick={() => onPick(q)}
                  className="border border-gray-3 bg-black px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-white/70 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  {q}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
