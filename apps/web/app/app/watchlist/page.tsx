"use client";

import { useState } from "react";
import { tradingPlans } from "@/features/plan/mock";
import { useWatchlist } from "@/features/watchlist/hooks/useWatchlist";
import { useToast } from "@/lib/toast";
import { DataLabel } from "@/components/ui/Marker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { rollupTicker } from "@/features/watchlist/lib/rollup";
import { TickerCard } from "@/features/watchlist/components/TickerCard";
import { WatchlistEmpty } from "@/features/watchlist/components/WatchlistEmpty";
import { WatchlistStatsStrip } from "@/features/watchlist/components/WatchlistStatsStrip";
import { WatchlistSortBar } from "@/features/watchlist/components/WatchlistSortBar";
import type { SortMode } from "@/features/watchlist/types";

export default function WatchlistPage() {
  const { tickers, hydrated, remove, clear } = useWatchlist();
  const toast = useToast();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("pinned");
  const [query, setQuery] = useState("");
  const latestId = tradingPlans[0].id;

  const rollupsRaw = hydrated ? tickers.map((t) => rollupTicker(t, latestId)) : [];
  const rollupsFiltered = query
    ? rollupsRaw.filter((r) =>
        r.ticker.toLowerCase().includes(query.toLowerCase())
      )
    : rollupsRaw;
  const rollups = [...rollupsFiltered].sort((a, b) => {
    if (sortMode === "alpha") return a.ticker.localeCompare(b.ticker);
    if (sortMode === "news") return b.newsItems.length - a.newsItems.length;
    if (sortMode === "r") return b.totalR - a.totalR;
    return 0; // "pinned" preserves original order
  });

  const aggregateR = rollups.reduce((acc, r) => acc + r.totalR, 0);
  const totalNews = rollups.reduce((acc, r) => acc + r.newsItems.length, 0);
  const totalLive = rollups.reduce((acc, r) => acc + r.liveSetups.length, 0);
  const totalClosed = rollups.reduce((acc, r) => acc + r.closedCount, 0);

  return (
    <div className="bg-grid-fine">
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

      {/* Hero */}
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <DataLabel>Operator · Watchlist</DataLabel>
              <h1 className="mt-2 font-display text-5xl text-paper">
                Your <span className="italic text-lime">pins</span>
              </h1>
              <p className="mt-2 max-w-2xl font-display text-lg text-paper/60">
                Instruments you've pinned for close monitoring. Every news
                item, live setup, and historical trade touching these tickers
                is rolled up here.
              </p>
            </div>
            {tickers.length > 0 && (
              <button
                onClick={() => setConfirmingClear(true)}
                className="border border-ink-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 hover:border-blood hover:text-blood"
              >
                ✕ Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {hydrated && tickers.length === 0 && <WatchlistEmpty />}

        {tickers.length > 0 && (
          <>
            <WatchlistStatsStrip
              pinnedCount={tickers.length}
              totalNews={totalNews}
              totalLive={totalLive}
              totalClosed={totalClosed}
              aggregateR={aggregateR}
            />

            {/* Filter search */}
            <div className="mb-6">
              <PageSearchInput
                value={query}
                onChange={setQuery}
                placeholder="Filter by ticker…   (press s to focus, esc to blur)"
                ariaLabel="Filter watchlist"
                matchLabel={
                  query
                    ? `${rollups.length} / ${tickers.length} SHOWN`
                    : null
                }
              />
            </div>

            <WatchlistSortBar
              sortMode={sortMode}
              onSortModeChange={setSortMode}
              label={
                query
                  ? `${rollups.length} / ${tickers.length} PER INSTRUMENT`
                  : "PER INSTRUMENT"
              }
            />

            <div className="space-y-6">
              {rollups.map((r) => (
                <TickerCard
                  key={r.ticker}
                  rollup={r}
                  onUnpin={() => {
                    remove(r.ticker);
                    toast.push({
                      tone: "info",
                      title: "Unpinned",
                      description: `${r.ticker} removed from your watchlist.`,
                      duration: 2000,
                    });
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
