"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SectionNumber,
  DataLabel,
  ImpactPill,
  BiasBadge,
} from "@/components/ui/Marker";
import { Highlight } from "@/components/ui/Highlight";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { BackToTop } from "@/components/ui/BackToTop";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSeenNews } from "@/features/news/hooks/useSeenNews";
import { useToast } from "@/lib/toast";
import { formatTime } from "@/lib/cn";
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
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-lime">
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
  const router = useRouter();
  const pathname = usePathname();
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

  useEffect(() => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (hideSeen) sp.set("hideseen", "1");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [query, hideSeen, pathname, router]);

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
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <DataLabel>Transmission TX-01 · Free pillar</DataLabel>
          <h1 className="mt-2 font-display text-5xl text-paper">
            Live <span className="italic text-lime">News</span>
          </h1>
          <p className="mt-2 max-w-2xl font-display text-lg text-paper/60">
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
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              {seenCount} seen
            </span>
            <button
              onClick={() => setHideSeen((v) => !v)}
              className={
                "border px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 transition-colors " +
                (hideSeen
                  ? "border-lime bg-lime/10 text-lime"
                  : "border-ink-3 text-paper/60 hover:border-lime hover:text-lime")
              }
            >
              {hideSeen ? "✓ HIDING SEEN" : "HIDE SEEN"}
            </button>
            <button
              onClick={() => setConfirmingResetSeen(true)}
              className="border border-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-blood hover:text-blood"
            >
              ↶ Reset seen
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <SectionNumber n="01 /" label={`${filtered.length} ITEMS`} />
          <div className="flex flex-wrap gap-px bg-ink-3">
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
                    ? "bg-lime text-ink"
                    : "bg-ink-2 text-paper/60 hover:bg-ink-2 hover:text-paper")
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="border border-ink-3 bg-ink-2/40 p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood">
              ● NULL TRANSMISSION
            </div>
            <div className="mt-3 font-display text-2xl text-paper">
              No items match{query ? ` "${query}"` : " this filter"}
              {filter !== "all" && query ? ` in the ${filter} cut` : ""}.
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              Try a different cut. The desk doesn't fabricate items to fill a screen.
            </p>
          </div>
        )}

        <div className="space-y-px bg-ink-3">
          {filtered.map((n) => {
            const isSeen = seenHydrated && seenIds.includes(n.id);
            const ts = n.published_at ?? n.fetched_at;
            return (
              <Link
                key={n.id}
                href={`/app/news/${n.id}`}
                className={
                  "group grid grid-cols-12 gap-6 bg-ink p-6 transition-colors hover:bg-ink-2 " +
                  (isSeen ? "opacity-60 hover:opacity-100" : "")
                }
              >
                <div className="col-span-12 lg:col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                      [{n.source_code}]
                    </div>
                    {isSeen && (
                      <span className="font-mono text-[8px] uppercase tracking-widest2 text-paper/40">
                        ✓ SEEN
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                    {formatTime(ts)}Z
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-lime">
                    BY <Highlight text={n.author.toUpperCase()} query={query.toUpperCase()} />
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <ImpactPill level={n.impact} />
                    <div>
                      <BiasBadge bias={n.bias} />
                    </div>
                  </div>
                </div>
                <div className="col-span-12 lg:col-span-10">
                  <h3
                    className={
                      "font-display text-2xl leading-snug transition-colors group-hover:text-lime " +
                      (isSeen ? "text-paper/70" : "text-paper")
                    }
                  >
                    <Highlight text={n.headline} query={query} />
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-paper/80">
                    <Highlight text={n.analysis} query={query} />
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <DataLabel>Affects</DataLabel>
                    {n.affects.map((a) => (
                      <span
                        key={a}
                        className="border border-paper/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/70"
                      >
                        <Highlight text={a} query={query} />
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
