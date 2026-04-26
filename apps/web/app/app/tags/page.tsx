"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";
import { allHashtags, hashtagMeta } from "@/features/tags/mock";
import { primers } from "@/features/education/mock";
import { news } from "@/features/news/mock";
import { consultSessions } from "@/features/consult/mock";
import { channelPosts } from "@/features/channel/mock";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { Highlight } from "@/components/ui/Highlight";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { BackToTop } from "@/components/ui/BackToTop";
import { cn } from "@/lib/cn";

type SortMode = "density" | "alpha" | "sparse";

const SORT_STORAGE_KEY = "ants-domain-tags-sort";

function parseSortMode(v: string | null): SortMode {
  return v === "alpha" || v === "sparse" ? v : "density";
}

function loadPersistedSort(): SortMode {
  if (typeof window === "undefined") return "density";
  try {
    return parseSortMode(localStorage.getItem(SORT_STORAGE_KEY));
  } catch {
    return "density";
  }
}

export default function TagsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">
            <span className="led" />
            DECODING TAG INDEX
          </div>
        </div>
      }
    >
      <TagsView />
    </Suspense>
  );
}

function TagsView() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<string>(
    () => searchParams.get("q")?.trim() ?? ""
  );
  // URL takes priority over localStorage on initial load
  const [sortMode, setSortModeState] = useState<SortMode>(() => {
    const fromUrl = searchParams.get("sort");
    if (fromUrl) return parseSortMode(fromUrl);
    return "density"; // hydrated in effect below
  });

  // After mount, if no URL param, honor the persisted choice
  useEffect(() => {
    if (!searchParams.get("sort")) {
      const persisted = loadPersistedSort();
      if (persisted !== "density") setSortModeState(persisted);
    }
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSortMode = (next: SortMode) => {
    setSortModeState(next);
    try {
      localStorage.setItem(SORT_STORAGE_KEY, next);
    } catch {}
  };

  // Sync URL on query / sort changes
  useUrlSyncedState({
    q: query || null,
    sort: sortMode !== "density" ? sortMode : null,
  });

  const countsRaw = useMemo(() => {
    // Single-pass tally. Prior implementation was O(tags × sources × items)
    // because each tag ran `.filter().length` over all four source arrays.
    // One pass over each source array, bumping a Map keyed by tag, drops it
    // to O(items × avg_tags_per_item) regardless of tag count.
    const tally = new Map<string, number>();
    for (const tag of allHashtags) tally.set(tag, 0);
    const bump = (tags: readonly string[]) => {
      for (const t of tags) {
        const prev = tally.get(t);
        // Ignore tags that aren't in `allHashtags` — mock sources occasionally
        // carry tags outside the declared taxonomy; the old `.includes(tag)`
        // loop would silently drop them too.
        if (prev !== undefined) tally.set(t, prev + 1);
      }
    };
    for (const p of primers) bump(p.tags);
    for (const n of news) bump(n.tags);
    for (const s of consultSessions) bump(s.tags);
    for (const c of channelPosts) bump(c.tags);
    return allHashtags.map((tag) => ({ tag, c: tally.get(tag) ?? 0 }));
  }, []);

  const counts = useMemo(() => {
    const sorted = [...countsRaw];
    if (sortMode === "density") {
      sorted.sort((a, b) => b.c - a.c);
    } else if (sortMode === "sparse") {
      sorted.sort((a, b) => a.c - b.c);
    } else {
      sorted.sort((a, b) => a.tag.localeCompare(b.tag));
    }
    return sorted;
  }, [countsRaw, sortMode]);

  const maxCount = Math.max(1, ...counts.map((c) => c.c));

  const visibleCounts = useMemo(() => {
    if (!query) return counts;
    const q = query.toLowerCase();
    return counts.filter(({ tag }) => {
      const meta = hashtagMeta[tag];
      const haystack = `${tag} ${meta.label} ${meta.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [counts, query]);

  return (
    <div className="stagger">
      <BackToTop />
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <DataLabel>Index · Cross-cut</DataLabel>
          <h1 className="mt-2 font-display text-5xl text-white">
            Hashtag <span className="italic text-brand">Explorer</span>
          </h1>
          <p className="mt-2 max-w-2xl font-display text-lg text-white/60">
            The connective tissue of the DOMAIN. Pull every primer, post,
            consultation log, and broadcast under a tag.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <PageSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search tags, labels, descriptions…   (press s to focus, esc to blur)"
            ariaLabel="Search hashtags"
            matchLabel={
              query
                ? `${visibleCounts.length} / ${counts.length} MATCHES for "${query}"`
                : null
            }
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <SectionNumber
            n="—"
            label={
              query
                ? `${visibleCounts.length} / ${allHashtags.length} ACTIVE TAGS`
                : `${allHashtags.length} ACTIVE TAGS`
            }
          />
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
              Sort
            </span>
            <div className="flex flex-wrap gap-px bg-gray-3">
              {(
                [
                  { v: "density", label: "Most used" },
                  { v: "sparse", label: "Least used" },
                  { v: "alpha", label: "A→Z" },
                ] as Array<{ v: SortMode; label: string }>
              ).map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setSortMode(opt.v)}
                  className={cn(
                    "px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 transition-colors",
                    sortMode === opt.v
                      ? "bg-brand text-black"
                      : "bg-gray-2 text-white/60 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {visibleCounts.length === 0 && query && (
          <div className="mt-6 border border-gray-3 bg-gray-2/40 p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-red-500">
              ● NULL TRANSMISSION
            </div>
            <div className="mt-3 font-display text-2xl text-white">
              No tags match "{query}".
            </div>
            <button
              onClick={() => setQuery("")}
              className="mt-6 border border-brand/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
            >
              ✕ Clear search
            </button>
          </div>
        )}

        <div className="mt-6 grid grid-cols-12 gap-px bg-gray-3">
          {visibleCounts.map(({ tag, c }, i) => {
            const meta = hashtagMeta[tag];
            const density = c / maxCount;
            const isHot = i < 3 && c > 0 && !query && sortMode === "density";
            return (
              <Link
                key={tag}
                href={`/app/tags/${tag}`}
                className="group relative col-span-12 overflow-hidden bg-black p-6 transition-colors hover:bg-gray-2 sm:col-span-6 lg:col-span-4"
              >
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-brand/70 transition-all group-hover:h-1"
                  style={{ width: `${Math.max(4, density * 100)}%` }}
                />
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {isHot && (
                      <span className="inline-flex items-center gap-1 border border-brand/60 bg-brand/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-brand">
                        <span className="led" />
                        TRENDING
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                    {c} items
                  </div>
                </div>
                <div className="mt-3 font-display text-2xl text-white">
                  <span className="text-brand">#</span>
                  <Highlight text={tag} query={query} />
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-brand/60">
                  <Highlight text={meta.label} query={query} />
                </div>
                <p className="mt-3 text-sm text-white/60">
                  <Highlight text={meta.description} query={query} />
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
