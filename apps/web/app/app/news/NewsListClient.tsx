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
import { cn } from "@/lib/cn";
import type { NewsListItem } from "@/features/news/queries/news";

type Filter = "all" | "high" | "medium" | "low" | "bullish" | "bearish";

function matchesQuery(n: NewsListItem, q: string): boolean {
  if (!q) return true;
  const haystack = [
    n.id,
    n.sourceCode,
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
          <div className="flex items-center gap-3 text-sm text-brand">
            <span className="led" aria-hidden />
            Loading news...
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
    <div className="stagger">
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
      <div className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <DataLabel>News</DataLabel>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Live <span className="text-brand">News</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/50">
            Raw market-moving news, annotated with what it actually means for
            price. No &quot;analysts say&quot;. No &quot;experts believe&quot;.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <PageSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search headlines, analysis, tickers, tags...   (press s to focus, esc to blur)"
            ariaLabel="Search news"
            matchLabel={
              query
                ? `${filtered.length} ${filtered.length === 1 ? "match" : "matches"} for "${query}"`
                : null
            }
          />
        </div>

        {seenHydrated && seenCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs text-white/40">
              {seenCount} seen
            </span>
            <button
              onClick={() => setHideSeen((v) => !v)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
                hideSeen
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-white/[0.1] text-white/50 hover:border-brand hover:text-brand"
              )}
            >
              {hideSeen ? "Showing unread" : "Hide seen"}
            </button>
            <button
              onClick={() => setConfirmingResetSeen(true)}
              className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-xs text-white/50 transition-colors hover:border-blood hover:text-blood-bright focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Reset seen
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <SectionNumber n="01" label={`${filtered.length} items`} />
          <div className="flex flex-wrap gap-1 rounded-lg bg-white/[0.03] p-1">
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
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
                  filter === f
                    ? "bg-brand text-black"
                    : "text-white/50 hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
            <p className="text-lg font-medium text-white">
              No items match{query ? ` "${query}"` : " this filter"}
              {filter !== "all" && query ? ` in ${filter}` : ""}.
            </p>
            <p className="mt-2 text-sm text-white/40">
              Try a different filter or search term.
            </p>
          </div>
        )}

        <div className="space-y-2">
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
