"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";
import { SectionNumber, DataLabel } from "@/components/ui/Marker";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { BackToTop } from "@/components/ui/BackToTop";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSeenNews } from "@/features/news/hooks/useSeenNews";
import { NewsListRow } from "@/features/news/components/NewsListRow";
import { useToast } from "@/lib/toast";
import type { NewsListItem } from "@/features/news/queries/news";

type Filter = "all" | "high" | "medium" | "low" | "bullish" | "bearish";

function matchesQuery(n: NewsListItem, q: string): boolean {
  if (!q) return true;
  const haystack = [
    n.id,
    n.source_code,
    n.headline,
    n.analysis,
    n.author,
    ...n.affects,
    ...n.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

export function NewsListClient({ items }: { items: NewsListItem[] }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">
            <span className="led lime" />
            DECODING NEWS FEED
          </div>
        </div>
      }
    >
      <View items={items} />
    </Suspense>
  );
}

function View({ items }: { items: NewsListItem[] }) {
  const searchParams = useSearchParams();
  const { ids: seenIds, hydrated: seenHydrated, reset: resetSeen } =
    useSeenNews();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState<string>(
    () => searchParams.get("q")?.trim() ?? ""
  );
  const [hideSeen, setHideSeen] = useState<boolean>(
    () => searchParams.get("hideseen") === "1"
  );
  const [confirmingResetSeen, setConfirmingResetSeen] = useState(false);

  useUrlSyncedState({
    q: query || null,
    hideseen: hideSeen ? "1" : null,
  });

  const seenSet = useMemo(() => new Set(seenIds), [seenIds]);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (filter !== "all") {
        if (filter === "high" || filter === "medium" || filter === "low") {
          if (n.impact !== filter) return false;
        } else if (n.bias !== filter) {
          return false;
        }
      }
      if (!matchesQuery(n, query)) return false;
      if (hideSeen && seenHydrated && seenSet.has(n.id)) return false;
      return true;
    });
  }, [items, filter, query, hideSeen, seenHydrated, seenSet]);

  const seenCount = useMemo(
    () =>
      seenHydrated ? items.filter((n) => seenSet.has(n.id)).length : 0,
    [items, seenSet, seenHydrated],
  );

  return (
    <div className="bg-grid-fine">
      <BackToTop />
      <ConfirmDialog
        open={confirmingResetSeen}
        title="Reset seen state?"
        description={`All ${seenCount} seen articles will flip back to unread. The articles themselves are unchanged.`}
        confirmLabel="Reset seen"
        cancelLabel="Keep"
        destructive
        onConfirm={() => {
          resetSeen();
          setConfirmingResetSeen(false);
          toast.push({
            tone: "warn",
            title: "Seen state cleared",
            description: "All news items back to unread.",
          });
        }}
        onCancel={() => setConfirmingResetSeen(false)}
      />
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <DataLabel>Transmission TX-01 · Free pillar</DataLabel>
          <h1 className="mt-2 font-display text-5xl text-white">
            Live <span className="italic text-brand">News</span>
          </h1>
          <p className="mt-2 max-w-2xl font-display text-lg text-white/60">
            Raw market-moving news, annotated with what it actually means for
            price. No "analysts say". No "experts believe".
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <PageSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search headlines, analysis, tickers, tags…   (press s to focus, esc to blur)"
            ariaLabel="Search news"
            matchLabel={
              query
                ? `${filtered.length} ${filtered.length === 1 ? "MATCH" : "MATCHES"} for "${query}"`
                : null
            }
          />
        </div>

        {seenHydrated && seenCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
              {seenCount} seen
            </span>
            <button
              onClick={() => setHideSeen((v) => !v)}
              className={
                "border px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 transition-colors " +
                (hideSeen
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-gray-3 text-white/60 hover:border-brand hover:text-brand")
              }
            >
              {hideSeen ? "✓ HIDING SEEN" : "HIDE SEEN"}
            </button>
            <button
              onClick={() => setConfirmingResetSeen(true)}
              className="border border-gray-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60 hover:border-blood hover:text-red-500"
            >
              ↶ Reset seen
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <SectionNumber n="01 /" label={`${filtered.length} ITEMS`} />
          <div className="flex flex-wrap gap-px bg-gray-3">
            {(
              [
                "all",
                "high",
                "medium",
                "low",
                "bullish",
                "bearish",
              ] as const
            ).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  "px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 transition-colors " +
                  (filter === f
                    ? "bg-brand text-black"
                    : "bg-gray-2 text-white/60 hover:bg-gray-2 hover:text-white")
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="border border-gray-3 bg-gray-2/40 p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-red-500">
              ● NULL TRANSMISSION
            </div>
            <div className="mt-3 font-display text-2xl text-white">
              No items match{query ? ` "${query}"` : " this filter"}
              {filter !== "all" && query ? ` in the ${filter} cut` : ""}.
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              Try a different cut. The desk doesn't fabricate items to fill a screen.
            </p>
          </div>
        )}

        <div className="space-y-px bg-gray-3">
          {filtered.map((n) => (
            <NewsListRow
              key={n.id}
              item={n}
              query={query}
              isSeen={seenHydrated && seenSet.has(n.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
