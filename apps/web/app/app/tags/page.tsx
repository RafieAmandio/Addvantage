"use client";

import Link from "next/link";
import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";
import { allHashtags, getHashtagMeta } from "@/features/tags/constants";
import { Panel } from "@/components/ui/Panel";
import { TextTabs } from "@/components/ui/TextTabs";
import { Highlight } from "@/components/ui/Highlight";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { BackToTop } from "@/components/ui/BackToTop";
import { cn } from "@/lib/cn";
import type { Hashtag } from "@tradevantage/shared";

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

type TagCountEntry = { tag: Hashtag; c: number };

export default function TagsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-[13px] text-white/40">
          Loading tags
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
    () => searchParams.get("q")?.trim() ?? "",
  );
  const [sortMode, setSortModeState] = useState<SortMode>(() => {
    const fromUrl = searchParams.get("sort");
    if (fromUrl) return parseSortMode(fromUrl);
    return "density";
  });

  const [tagCounts, setTagCounts] = useState<TagCountEntry[] | null>(null);

  useEffect(() => {
    if (!searchParams.get("sort")) {
      const persisted = loadPersistedSort();
      if (persisted !== "density") setSortModeState(persisted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3100";
    fetch(`${apiBase}/tags/counts`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.data && Array.isArray(json.data)) {
          setTagCounts(
            (json.data as Array<{ tag: string; total: number }>).map((item) => ({
              tag: item.tag as Hashtag,
              c: item.total,
            })),
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const countsRaw: TagCountEntry[] = useMemo(() => {
    if (tagCounts) return tagCounts;
    return allHashtags.map((tag) => ({ tag, c: 0 }));
  }, [tagCounts]);

  const setSortMode = (next: SortMode) => {
    setSortModeState(next);
    try {
      localStorage.setItem(SORT_STORAGE_KEY, next);
    } catch {}
  };

  useUrlSyncedState({
    q: query || null,
    sort: sortMode !== "density" ? sortMode : null,
  });

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
      const meta = getHashtagMeta(tag);
      const haystack = `${tag} ${meta.label} ${meta.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [counts, query]);

  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <BackToTop />
      <PageSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search tags and descriptions"
        ariaLabel="Search hashtags"
        matchLabel={query ? `${visibleCounts.length} of ${counts.length} match "${query}"` : null}
      />

      <Panel
        title={query ? `${visibleCounts.length} of ${allHashtags.length} tags` : `${allHashtags.length} tags`}
        sub="Pull every primer and news item under a tag"
        action={<div className="hidden sm:block"><TextTabs
            options={[
              { id: "density", label: "Most used" },
              { id: "sparse", label: "Least used" },
              { id: "alpha", label: "A to Z" },
            ] as const}
            value={sortMode}
            onChange={setSortMode}
            label="Sort"
          /></div>}
      >
        <div className="-mt-1 mb-2 sm:hidden"><TextTabs
            options={[
              { id: "density", label: "Most used" },
              { id: "sparse", label: "Least used" },
              { id: "alpha", label: "A to Z" },
            ] as const}
            value={sortMode}
            onChange={setSortMode}
            label="Sort"
          /></div>
        {visibleCounts.length === 0 && query ? (
          <div className="py-10 text-center">
            <p className="text-[17px] font-medium text-white">No tags match &quot;{query}&quot;.</p>
            <button
              onClick={() => setQuery("")}
              className="mt-4 rounded-full border border-white/[0.14] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              Clear search
            </button>
          </div>
        ) : (
          <ul className="-my-1 grid gap-x-8 md:grid-cols-2">
            {visibleCounts.map(({ tag, c }) => {
              const meta = getHashtagMeta(tag);
              return (
                <li key={tag} className="border-b border-white/[0.07]">
                  <Link
                    href={`/app/tags/${tag}`}
                    className="group -mx-2 flex gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-white">
                        <span className="text-white/30">#</span>
                        <Highlight text={tag} query={query} />
                        <span className="ml-2 text-[13px] font-normal text-white/40">
                          <Highlight text={meta.label} query={query} />
                        </span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[13px] leading-[19px] text-white/55">
                        <Highlight text={meta.description} query={query} />
                      </p>
                    </div>
                    <div className="w-14 shrink-0 text-right">
                      <p className={cn("font-num text-[24px] font-semibold leading-7", c > 0 ? "text-white" : "text-white/30")}>
                        {tagCounts ? c : "…"}
                      </p>
                      {/* Share of the busiest tag. */}
                      <div className={cn("mt-1 h-0.5 bg-white/[0.07]", !tagCounts && "hidden")}>
                        <div className="h-full bg-brand" style={{ width: `${(c / maxCount) * 100}%` }} />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
