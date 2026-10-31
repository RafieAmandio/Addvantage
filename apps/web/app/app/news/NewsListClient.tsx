"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";
import Link from "next/link";
import { FOREX_PAIRS } from "@tradevantage/shared";
import { Panel } from "@/components/ui/Panel";
import { TextTabs } from "@/components/ui/TextTabs";
import { NewsCalendar, newsPulse } from "@/features/instrument/components/DotMatrix";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { BackToTop } from "@/components/ui/BackToTop";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSeenNews } from "@/features/news/hooks/useSeenNews";
import { NewsListRow } from "@/features/news/components/NewsListRow";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import type { NewsListItem } from "@/features/news/queries/news";

type Filter = "all" | "high" | "medium" | "low" | "bullish" | "bearish";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "high", label: "High impact" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
  { id: "bullish", label: "Bullish" },
  { id: "bearish", label: "Bearish" },
] as const;

const PAIRS = new Set(FOREX_PAIRS.map((p) => p.symbol.replace("/", "")));

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

  const pulse = useMemo(() => newsPulse(items, 91), [items]);
  const split = useMemo(() => {
    const c = { bullish: 0, neutral: 0, bearish: 0 };
    for (const n of items) c[n.bias]++;
    return c;
  }, [items]);
  const mentions = useMemo(() => {
    const c = new Map<string, number>();
    for (const n of items) for (const a of n.affects) c.set(a, (c.get(a) ?? 0) + 1);
    return [...c].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [items]);
  const newest = items[0]?.publishedAt ?? items[0]?.fetchedAt;
  const newestDays = newest ? Math.floor((Date.now() - new Date(newest).getTime()) / 86_400_000) : 0;

  return (
    <div>
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
      <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <PageSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search headlines, analysis, tickers, tags   (s)"
            ariaLabel="Search news"
            matchLabel={query ? `${filtered.length} ${filtered.length === 1 ? "match" : "matches"} for "${query}"` : null}
          />

          <Panel
            title={`${filtered.length} items`}
            sub={newestDays >= 2 ? <span className="text-down">No new items in {newestDays} days</span> : "Newest first, WIB"}
            action={
              seenHydrated && seenCount > 0 ? (
                <div className="flex items-center gap-3 text-[13px]">
                  <button
                    type="button"
                    onClick={() => setHideSeen((v) => !v)}
                    className={cn("font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand", hideSeen ? "text-brand" : "text-white/55 hover:text-white")}
                  >
                    {hideSeen ? "Showing unread" : `Hide ${seenCount} seen`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingResetSeen(true)}
                    className="font-medium text-white/30 hover:text-down focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                  >
                    Reset
                  </button>
                </div>
              ) : null
            }
          >
            <TextTabs options={FILTERS} value={filter} onChange={setFilter} label="Filter news" className="mb-2" />
            {filtered.length === 0 ? (
              <p className="py-10 text-center text-[14px] text-white/40">
                No items match{query ? ` "${query}"` : " this filter"}.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.07]">
                {filtered.map((n) => (
                  <NewsListRow key={n.id} item={n} query={query} isSeen={seenHydrated && seenSet.has(n.id)} />
                ))}
              </div>
            )}
          </Panel>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Panel title="Coverage" sub="Items per day, one column per week, coloured by bias">
            <NewsCalendar days={pulse} />
            <div className="mt-1.5 flex justify-between font-mono text-[11px] text-white/30">
              <span>13 weeks ago</span>
              <span>this week</span>
            </div>
          </Panel>

          <Panel title="Bias split" sub={`Across ${items.length} items`}>
            <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="bg-up" style={{ width: `${(split.bullish / Math.max(1, items.length)) * 100}%` }} />
              <div className="bg-white/40" style={{ width: `${(split.neutral / Math.max(1, items.length)) * 100}%` }} />
              <div className="bg-down" style={{ width: `${(split.bearish / Math.max(1, items.length)) * 100}%` }} />
            </div>
            <dl className="mt-3 grid grid-cols-3 text-[12px]">
              {(["bullish", "neutral", "bearish"] as const).map((k) => (
                <div key={k}>
                  <dt className="capitalize text-white/40">{k}</dt>
                  <dd className={cn("font-num text-[22px] font-semibold leading-6", k === "bullish" ? "text-up" : k === "bearish" ? "text-down" : "text-white")}>{split[k]}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Most mentioned" sub="Tickers named in the feed">
            <ul className="-my-1 divide-y divide-white/[0.07]">
              {mentions.map(([t, c]) => (
                <li key={t}>
                  {PAIRS.has(t) ? (
                    <Link href={`/app/instrument/${t}`} className="flex items-center justify-between py-2 text-[14px] font-semibold text-white hover:text-brand">
                      {t}
                      <span className="font-num text-[18px] text-white/55">{c}</span>
                    </Link>
                  ) : (
                    <button type="button" onClick={() => setQuery(t)} className="flex w-full items-center justify-between py-2 text-left text-[14px] font-semibold text-white/75 hover:text-white">
                      {t}
                      <span className="font-num text-[18px] text-white/40">{c}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
