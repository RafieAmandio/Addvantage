"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/state";
import {
  search,
  groupResults,
  type SearchResult,
} from "@/features/search/search";
import { getRecentVisits, type RecentVisit } from "@/lib/visits";
import {
  loadRecentSearches,
  pushRecentSearch,
  saveRecentSearches,
} from "@/features/search/lib/recent-searches";
import { SearchPaletteHeader } from "./SearchPaletteHeader";
import { SearchPaletteEmpty } from "./SearchPaletteEmpty";
import { SearchPaletteNoResults } from "./SearchPaletteNoResults";
import { SearchPaletteGroup } from "./SearchPaletteGroup";

export function SearchPalette() {
  const { searchOpen, setSearchOpen } = useAppState();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [visits, setVisits] = useState<RecentVisit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setRecent(loadRecentSearches());
  }, []);

  useEffect(() => {
    if (searchOpen) setVisits(getRecentVisits());
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setResults([]);
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [searchOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const r = await search(q, 30);
      setResults(r);
      setSearching(false);
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const grouped = groupResults(results);
  const flat = grouped.flatMap(([, items]) => items);

  useEffect(() => {
    if (active >= flat.length) setActive(0);
  }, [flat.length, active]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-result-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const commit = useCallback(
    (r: SearchResult) => {
      const next = pushRecentSearch(recent, query);
      setRecent(next);
      saveRecentSearches(next);
      setSearchOpen(false);
      router.push(r.href);
    },
    [recent, query, setSearchOpen, router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flat[active];
      if (target) commit(target);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSearchOpen(false);
    }
  };

  const pickQuery = (q: string) => {
    setQuery(q);
    setActive(0);
    inputRef.current?.focus();
  };

  if (!searchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh] sm:pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search the DOMAIN"
    >
      <div
        onClick={() => setSearchOpen(false)}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />

      <div className="relative w-full max-w-3xl border border-brand bg-gray-2 shadow-[0_0_80px_rgba(245,158,11,0.18)]">
        <div className="classification-stripe h-1" />

        <SearchPaletteHeader
          ref={inputRef}
          query={query}
          onQueryChange={(v) => {
            setQuery(v);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          onClose={() => setSearchOpen(false)}
          resultCount={results.length}
          channelCount={grouped.length}
        />

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {!query && (
            <SearchPaletteEmpty
              recent={recent}
              visits={visits}
              onPick={pickQuery}
              onJump={(href) => {
                setSearchOpen(false);
                router.push(href);
              }}
            />
          )}

          {query && !searching && results.length === 0 && (
            <SearchPaletteNoResults
              query={query}
              recent={recent}
              onPick={pickQuery}
            />
          )}

          {query && searching && results.length === 0 && (
            <div className="px-5 py-8 text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                Searching…
              </div>
            </div>
          )}

          {query &&
            (() => {
              let startIndex = 0;
              return grouped.map(([kind, items]) => {
                const node = (
                  <SearchPaletteGroup
                    key={kind}
                    kind={kind}
                    items={items}
                    startIndex={startIndex}
                    activeIndex={active}
                    query={query}
                    onHover={setActive}
                    onCommit={commit}
                  />
                );
                startIndex += items.length;
                return node;
              });
            })()}
        </div>
      </div>
    </div>
  );
}
