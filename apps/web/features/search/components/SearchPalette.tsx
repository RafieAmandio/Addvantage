"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [visits, setVisits] = useState<RecentVisit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Hydrate recents
  useEffect(() => {
    setRecent(loadRecentSearches());
  }, []);

  // Refresh visit list whenever the palette opens
  useEffect(() => {
    if (searchOpen) setVisits(getRecentVisits());
  }, [searchOpen]);

  // Reset on open
  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setActive(0);
      // Defer focus until after the modal mounts
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [searchOpen]);

  const results = useMemo(() => search(query, 30), [query]);
  const grouped = useMemo(() => groupResults(results), [results]);
  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  // Clamp active when results change
  useEffect(() => {
    if (active >= flat.length) setActive(0);
  }, [flat.length, active]);

  // Scroll active into view
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
      {/* Backdrop */}
      <div
        onClick={() => setSearchOpen(false)}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Palette */}
      <div className="relative w-full max-w-3xl border border-brand bg-gray-2 shadow-[0_0_80px_rgba(245,158,11,0.18)]">
        {/* Classification stripe */}
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

        {/* Body */}
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

          {query && results.length === 0 && (
            <SearchPaletteNoResults
              query={query}
              recent={recent}
              onPick={pickQuery}
            />
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
