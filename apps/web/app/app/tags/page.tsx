"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { allHashtags, hashtagMeta } from "@/lib/mock/hashtags";
import { primers } from "@/lib/mock/primers";
import { news } from "@/lib/mock/news";
import { consultSessions } from "@/lib/mock/consultations";
import { channelPosts } from "@/lib/mock/channel";
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
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-amber">
            <span className="led amber" />
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
  const router = useRouter();
  const pathname = usePathname();
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
  useEffect(() => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (sortMode !== "density") sp.set("sort", sortMode);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [query, sortMode, pathname, router]);

  const countsRaw = useMemo(
    () =>
      allHashtags.map((tag) => {
        const c =
          primers.filter((p) => p.tags.includes(tag)).length +
          news.filter((n) => n.tags.includes(tag)).length +
          consultSessions.filter((s) => s.tags.includes(tag)).length +
          channelPosts.filter((c) => c.tags.includes(tag)).length;
        return { tag, c };
      }),
    []
  );

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
    <div>
      <BackToTop />
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <DataLabel>Index · Cross-cut</DataLabel>
          <h1 className="mt-2 font-display text-5xl text-paper">
            Hashtag <span className="italic text-amber">Explorer</span>
          </h1>
          <p className="mt-2 max-w-2xl font-display text-lg text-paper/60">
            The connective tissue of the DOMAIN. Pull every primer, post,
            consultation log, and broadcast under a tag.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Search */}
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
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              Sort
            </span>
            <div className="flex flex-wrap gap-px bg-ink-3">
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
                      ? "bg-amber text-ink"
                      : "bg-ink-2 text-paper/60 hover:text-paper"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {visibleCounts.length === 0 && query && (
          <div className="mt-6 border border-ink-3 bg-ink-2/40 p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood">
              ● NULL TRANSMISSION
            </div>
            <div className="mt-3 font-display text-2xl text-paper">
              No tags match "{query}".
            </div>
            <button
              onClick={() => setQuery("")}
              className="mt-6 border border-amber/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-amber hover:bg-amber hover:text-ink"
            >
              ✕ Clear search
            </button>
          </div>
        )}

        <div className="mt-6 grid grid-cols-12 gap-px bg-ink-3">
          {visibleCounts.map(({ tag, c }, i) => {
            const meta = hashtagMeta[tag];
            const density = c / maxCount;
            const isHot = i < 3 && c > 0 && !query && sortMode === "density";
            return (
              <Link
                key={tag}
                href={`/app/tags/${tag}`}
                className="group relative col-span-12 overflow-hidden bg-ink p-6 transition-colors hover:bg-ink-2 sm:col-span-6 lg:col-span-4"
              >
                {/* Density bar — bottom edge, scaled to count */}
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-amber/70 transition-all group-hover:h-1"
                  style={{ width: `${Math.max(4, density * 100)}%` }}
                />
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {isHot && (
                      <span className="inline-flex items-center gap-1 border border-amber/60 bg-amber/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-amber">
                        <span className="led amber" />
                        TRENDING
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                    {c} items
                  </div>
                </div>
                <div className="mt-3 font-display text-2xl text-paper">
                  <span className="text-amber">#</span>
                  <Highlight text={tag} query={query} />
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-amber/60">
                  <Highlight text={meta.label} query={query} />
                </div>
                <p className="mt-3 text-sm text-paper/60">
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
