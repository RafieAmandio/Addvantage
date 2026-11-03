"use client";

import { useCallback, useMemo, useState } from "react";
import { useWatchlist } from "@/features/watchlist/hooks/useWatchlist";
import { useToast } from "@/lib/toast";
import { Panel } from "@/components/ui/Panel";
import { formatDate, formatWibTime } from "@/lib/cn";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { rollupTicker } from "@/features/watchlist/lib/rollup";
import { TickerCard } from "@/features/watchlist/components/TickerCard";
import { WatchlistEmpty } from "@/features/watchlist/components/WatchlistEmpty";
import { WatchlistStatsStrip } from "@/features/watchlist/components/WatchlistStatsStrip";
import { WatchlistSortBar } from "@/features/watchlist/components/WatchlistSortBar";
import type { SortMode } from "@/features/watchlist/types";
import type { NewsListItem } from "@/features/news/queries/news";
import type { TradingPlan } from "@/features/plan/types";
import type { AtrPair } from "@/features/atr/types";

interface Props {
  news: NewsListItem[];
  plans: TradingPlan[];
  pairs: AtrPair[];
}

export function WatchlistClient({ news, plans, pairs }: Props) {
  const { tickers, hydrated, remove, clear } = useWatchlist();
  const toast = useToast();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("pinned");
  const [query, setQuery] = useState("");
  const latestId = plans[0]?.id ?? "";

  const rollupsRaw = useMemo(
    () => (hydrated ? tickers.map((t) => rollupTicker(t, latestId, news, plans)) : []),
    [hydrated, tickers, latestId, news, plans],
  );
  const rollupsFiltered = query
    ? rollupsRaw.filter((r) =>
        r.ticker.toLowerCase().includes(query.toLowerCase())
      )
    : rollupsRaw;
  const rollups = [...rollupsFiltered].sort((a, b) => {
    if (sortMode === "alpha") return a.ticker.localeCompare(b.ticker);
    if (sortMode === "news") return b.newsItems.length - a.newsItems.length;
    if (sortMode === "r") return b.totalR - a.totalR;
    return 0;
  });

  const bySym = useMemo(() => new Map(pairs.map((p) => [p.symbol.replace("/", ""), p])), [pairs]);

  // Every headline that touches a pin, newest first, once.
  const mentions = useMemo(() => {
    const seen = new Map<string, NewsListItem>();
    for (const r of rollupsRaw) for (const n of r.newsItems) seen.set(n.id, n);
    const ts = (n: NewsListItem) => n.publishedAt ?? n.fetchedAt;
    return [...seen.values()].sort((a, b) => ts(b).localeCompare(ts(a))).slice(0, 8);
  }, [rollupsRaw]);

  const aggregateR = rollups.reduce((acc, r) => acc + r.totalR, 0);
  const totalNews = rollups.reduce((acc, r) => acc + r.newsItems.length, 0);
  const totalLive = rollups.reduce((acc, r) => acc + r.liveSetups.length, 0);
  const totalClosed = rollups.reduce((acc, r) => acc + r.closedCount, 0);

  const handleUnpin = useCallback(
    (ticker: string) => {
      remove(ticker);
      toast.push({
        tone: "info",
        title: "Unpinned",
        description: `${ticker} removed from your watchlist.`,
        duration: 2000,
      });
    },
    [remove, toast],
  );

  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <ConfirmDialog
        open={confirmingClear}
        title="Clear watchlist?"
        description={`All ${tickers.length} pinned ticker${tickers.length === 1 ? "" : "s"} will be removed. You can re-pin them from the news or plan pages.`}
        confirmLabel="Clear all"
        cancelLabel="Keep"
        destructive
        onConfirm={() => {
          clear();
          setConfirmingClear(false);
          toast.push({
            tone: "warn",
            title: "Watchlist cleared",
            description: "All pinned tickers removed.",
          });
        }}
        onCancel={() => setConfirmingClear(false)}
      />

      <div className="min-w-0 space-y-4">
        {hydrated && tickers.length === 0 && <WatchlistEmpty />}

        {tickers.length > 0 && (
          <>
            <PageSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter by ticker (press s)"
              ariaLabel="Filter watchlist"
              matchLabel={query ? `${rollups.length} of ${tickers.length} shown` : null}
            />
            <Panel
              title={query ? `${rollups.length} of ${tickers.length} pinned` : `${tickers.length} pinned`}
              sub="Prices from the ATR scanner, setups from the plan archive"
              action={<div className="hidden sm:block"><WatchlistSortBar sortMode={sortMode} onSortModeChange={setSortMode} /></div>}
            >
              <div className="-mt-1 mb-2 sm:hidden"><WatchlistSortBar sortMode={sortMode} onSortModeChange={setSortMode} /></div>
              <ul className="-my-3.5 divide-y divide-white/[0.07]">
                {rollups.map((r) => (
                  <TickerCard
                    key={r.ticker}
                    rollup={r}
                    pair={bySym.get(r.ticker.replace("/", "").toUpperCase())}
                    onUnpin={handleUnpin}
                  />
                ))}
              </ul>
            </Panel>
          </>
        )}
      </div>

      {tickers.length > 0 && (
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <WatchlistStatsStrip
            pinnedCount={tickers.length}
            totalNews={totalNews}
            totalLive={totalLive}
            totalClosed={totalClosed}
            aggregateR={aggregateR}
          />
          <Panel title="Latest mentions" sub={mentions.length ? undefined : "Nothing on the wire mentions your pins"}>
            {mentions.length > 0 && (
              <ul className="-my-2.5 divide-y divide-white/[0.07]">
                {mentions.map((n) => {
                  const ts = n.publishedAt ?? n.fetchedAt;
                  return (
                    <li key={n.id}>
                      <Link href={`/app/news/${n.id}`} className="group block py-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
                          {n.sourceCode}
                          <span className="px-1.5 text-white/20">/</span>
                          {formatDate(ts)} {formatWibTime(ts)}
                          {n.impact === "high" && <span className="ml-2 text-brand">High</span>}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[14px] leading-[21px] text-white/90 group-hover:text-white">{n.headline}</p>
                        <p className="mt-1 flex flex-wrap gap-1.5">
                          {n.affects.filter((a) => tickers.includes(a)).map((a) => (
                            <span key={a} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] text-white/60">{a}</span>
                          ))}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          <button
            onClick={() => setConfirmingClear(true)}
            className="rounded-full border border-white/[0.14] px-4 py-1.5 text-[13px] font-medium text-white/55 transition-colors hover:bg-raised hover:text-down focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Clear watchlist
          </button>
        </aside>
      )}
    </div>
  );
}
