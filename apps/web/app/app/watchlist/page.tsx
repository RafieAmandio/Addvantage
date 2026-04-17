"use client";

import Link from "next/link";
import { useState } from "react";
import { news } from "@/lib/mock/news";
import { tradingPlans, getAllPlans } from "@/lib/mock/plans";
import { calendar, CURRENCIES } from "@/lib/mock/calendar";
import { useWatchlist } from "@/lib/watchlist";
import { useToast } from "@/lib/toast";
import { DataLabel, SectionNumber, ImpactPill, BiasBadge } from "@/components/ui/Marker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { WatchPin } from "@/components/ui/WatchPin";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { formatDate, formatTime, cn } from "@/lib/cn";
import type { CalendarEvent, TradingPlan, TradingSetup } from "@/lib/mock/types";

/**
 * Decide if a calendar event is "relevant" to a ticker.
 * We check two things:
 *   1. The ticker matches one of the currency codes — take events where
 *      that currency's impact score is >= 5.
 *   2. The ticker appears in the event's notes (e.g. "BBCA" in BI rate note).
 */
function calendarEventsFor(ticker: string): CalendarEvent[] {
  const t = ticker.toUpperCase();
  const currencyIdx = (CURRENCIES as ReadonlyArray<string>).indexOf(t);
  return calendar.filter((e) => {
    if (currencyIdx >= 0 && e.scores[currencyIdx] >= 5) return true;
    if (e.notes && e.notes.toUpperCase().includes(t)) return true;
    if (e.title.toUpperCase().includes(t)) return true;
    return false;
  });
}

interface TickerRollup {
  ticker: string;
  newsItems: typeof news;
  liveSetups: Array<{ plan: TradingPlan; setup: TradingSetup }>;
  archiveSetups: Array<{ plan: TradingPlan; setup: TradingSetup }>;
  calendarEvents: CalendarEvent[];
  totalR: number;
  closedCount: number;
}

function rollupTicker(ticker: string, latestId: string): TickerRollup {
  const newsItems = news.filter((n) => n.affects.includes(ticker));
  const allPlans = getAllPlans();

  const liveSetups: Array<{ plan: TradingPlan; setup: TradingSetup }> = [];
  const archiveSetups: Array<{ plan: TradingPlan; setup: TradingSetup }> = [];

  for (const p of allPlans) {
    for (const s of p.setups) {
      if (s.instrument !== ticker) continue;
      if (p.id === latestId) {
        liveSetups.push({ plan: p, setup: s });
      } else {
        archiveSetups.push({ plan: p, setup: s });
      }
    }
  }

  let totalR = 0;
  let closedCount = 0;
  for (const { setup } of archiveSetups) {
    if (setup.outcomeR) {
      const n = parseFloat(setup.outcomeR.replace(/R/i, ""));
      if (isFinite(n)) {
        totalR += n;
        closedCount += 1;
      }
    }
  }

  return {
    ticker,
    newsItems,
    liveSetups,
    archiveSetups,
    calendarEvents: calendarEventsFor(ticker),
    totalR,
    closedCount,
  };
}

type SortMode = "pinned" | "news" | "r" | "alpha";

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
        {/* Empty state */}
        {hydrated && tickers.length === 0 && (
          <div className="border border-ink-3 bg-ink-2/40 p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
              ● WATCHLIST EMPTY
            </div>
            <div className="mt-3 font-display text-3xl text-paper">
              No pins yet.
            </div>
            <p className="mt-3 max-w-md mx-auto font-display text-base text-paper/60">
              Pin an instrument from any news item's{" "}
              <span className="text-lime">Affects</span> list or from the{" "}
              <span className="text-lime">Trading Plan</span> setup cards. It
              will show up here with its history, live setups, and news mentions.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                href="/app/news"
                className="border border-lime/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
              >
                Browse news →
              </Link>
              <Link
                href="/app/plan"
                className="border border-lime/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
              >
                Open live plan →
              </Link>
            </div>
          </div>
        )}

        {/* Aggregate stats */}
        {tickers.length > 0 && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-px bg-ink-3 sm:grid-cols-4">
              <div className="bg-ink p-5">
                <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                  Pinned
                </div>
                <div className="mt-1 font-display text-3xl text-lime">
                  {tickers.length}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                  instruments
                </div>
              </div>
              <div className="bg-ink p-5">
                <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                  News mentions
                </div>
                <div className="mt-1 font-display text-3xl text-paper">
                  {totalNews}
                </div>
              </div>
              <div className="bg-ink p-5">
                <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                  Live setups
                </div>
                <div className="mt-1 font-display text-3xl text-paper">
                  {totalLive}
                </div>
              </div>
              <div className="bg-ink p-5">
                <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                  Archive R · {totalClosed} closed
                </div>
                <div
                  className={
                    "mt-1 font-display text-3xl " +
                    (aggregateR > 0
                      ? "text-moss"
                      : aggregateR < 0
                      ? "text-blood"
                      : "text-paper/70")
                  }
                >
                  {totalClosed === 0
                    ? "—"
                    : (aggregateR >= 0 ? "+" : "") + aggregateR.toFixed(1) + "R"}
                </div>
              </div>
            </div>

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

            {/* Per-ticker cards */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <SectionNumber
                n="—"
                label={
                  query
                    ? `${rollups.length} / ${tickers.length} PER INSTRUMENT`
                    : "PER INSTRUMENT"
                }
              />
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                  Sort
                </span>
                <div className="flex flex-wrap gap-px bg-ink-3">
                  {(
                    [
                      { v: "pinned", label: "Pin order" },
                      { v: "news", label: "News" },
                      { v: "r", label: "R" },
                      { v: "alpha", label: "A→Z" },
                    ] as Array<{ v: SortMode; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => setSortMode(opt.v)}
                      className={cn(
                        "px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 transition-colors",
                        sortMode === opt.v
                          ? "bg-lime text-ink"
                          : "bg-ink-2 text-paper/60 hover:text-paper"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
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

function TickerCard({
  rollup,
  onUnpin,
}: {
  rollup: TickerRollup;
  onUnpin: () => void;
}) {
  const {
    ticker,
    newsItems,
    liveSetups,
    archiveSetups,
    calendarEvents,
    totalR,
    closedCount,
  } = rollup;

  return (
    <section className="border border-ink-3 bg-ink-2/20">
      {/* Card header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-3 bg-ink-2/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <WatchPin ticker={ticker} size="md" />
          <div>
            <div className="font-display text-4xl italic text-lime">
              {ticker}
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
              {newsItems.length} news · {liveSetups.length} live ·{" "}
              {archiveSetups.length} historical · {calendarEvents.length}{" "}
              upcoming
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {closedCount > 0 && (
            <div className="text-right">
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                Edge · {closedCount} closed
              </div>
              <div
                className={
                  "font-display text-2xl " +
                  (totalR > 0
                    ? "text-moss"
                    : totalR < 0
                    ? "text-blood"
                    : "text-paper/60")
                }
              >
                {(totalR >= 0 ? "+" : "") + totalR.toFixed(1)}R
              </div>
            </div>
          )}
          <button
            onClick={onUnpin}
            className="border border-ink-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-blood hover:text-blood"
          >
            ✕ Unpin
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
        {/* Left: recent news */}
        <div>
          <DataLabel>Recent news · {newsItems.length}</DataLabel>
          {newsItems.length === 0 ? (
            <div className="mt-3 border border-ink-3 bg-ink p-4 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              ● Nothing on the wire mentions {ticker} right now.
            </div>
          ) : (
            <div className="mt-3 space-y-px bg-ink-3">
              {newsItems.slice(0, 4).map((n) => (
                <Link
                  key={n.id}
                  href={`/app/news/${n.id}`}
                  className="group block bg-ink p-3 transition-colors hover:bg-ink-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
                      {n.id}
                    </span>
                    <ImpactPill level={n.impact} />
                    <BiasBadge bias={n.bias} />
                    <span className="ml-auto font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                      {formatDate(n.ts)} · {formatTime(n.ts)}Z
                    </span>
                  </div>
                  <div className="mt-1 font-display text-base leading-snug text-paper transition-colors group-hover:text-lime">
                    {n.headline}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: setups */}
        <div className="space-y-5">
          {liveSetups.length > 0 && (
            <div>
              <DataLabel>Live setup · current plan</DataLabel>
              <div className="mt-3 space-y-px bg-ink-3">
                {liveSetups.map(({ plan: p, setup: s }) => (
                  <Link
                    key={`${p.id}-${s.id}`}
                    href={`/app/plan/${p.id}#${s.id}`}
                    className="group block bg-ink p-3 transition-colors hover:bg-ink-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
                        {p.id} · {s.id}
                      </span>
                      <span
                        className={
                          "font-mono text-[9px] uppercase tracking-widest2 " +
                          (s.direction === "long" ? "text-moss" : "text-lime")
                        }
                      >
                        {s.direction}
                      </span>
                      <span className="ml-auto border border-lime bg-lime/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-lime">
                        ● LIVE
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-paper/70">
                      Entry {s.entry}
                    </div>
                    <div className="font-mono text-[10px] text-paper/70">
                      Stop <span className="text-blood">{s.stop}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {archiveSetups.length > 0 && (
            <div>
              <DataLabel>Historical · {archiveSetups.length}</DataLabel>
              <div className="mt-3 space-y-px bg-ink-3">
                {archiveSetups.map(({ plan: p, setup: s }) => {
                  const isWin = s.outcome === "win";
                  const isLoss =
                    s.outcome === "loss" || s.outcome === "stopped";
                  return (
                    <Link
                      key={`${p.id}-${s.id}`}
                      href={`/app/plan/${p.id}#${s.id}`}
                      className="group block bg-ink p-3 transition-colors hover:bg-ink-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/50">
                          {p.id} · {s.id}
                        </span>
                        <span
                          className={
                            "font-mono text-[9px] uppercase tracking-widest2 " +
                            (s.direction === "long"
                              ? "text-moss"
                              : "text-lime")
                          }
                        >
                          {s.direction}
                        </span>
                        <span className="ml-auto font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                          {formatDate(p.date)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between gap-2">
                        <div className="truncate font-mono text-[10px] text-paper/60">
                          {s.rationale}
                        </div>
                        {s.outcomeR && (
                          <div
                            className={cn(
                              "shrink-0 font-display text-lg",
                              isWin
                                ? "text-moss"
                                : isLoss
                                ? "text-blood"
                                : "text-paper/60"
                            )}
                          >
                            {s.outcomeR}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {liveSetups.length === 0 && archiveSetups.length === 0 && (
            <div>
              <DataLabel>Setups</DataLabel>
              <div className="mt-3 border border-ink-3 bg-ink p-4 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                ● No setups on {ticker} in the current plan or archive.
              </div>
            </div>
          )}

          {calendarEvents.length > 0 && (
            <div>
              <DataLabel>Upcoming events · {calendarEvents.length}</DataLabel>
              <div className="mt-3 space-y-px bg-ink-3">
                {calendarEvents.slice(0, 3).map((e) => (
                  <Link
                    key={e.id}
                    href="/app/calendar"
                    className="group block bg-ink p-3 transition-colors hover:bg-ink-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
                        {e.id}
                      </span>
                      <span
                        className={
                          "font-mono text-[9px] uppercase tracking-widest2 " +
                          (e.impact === "high"
                            ? "text-blood"
                            : e.impact === "medium"
                            ? "text-lime"
                            : "text-moss")
                        }
                      >
                        {e.impact.toUpperCase()}
                      </span>
                      <span className="ml-auto font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                        {formatDate(e.ts)} · {formatTime(e.ts)}Z
                      </span>
                    </div>
                    <div className="mt-1 font-display text-sm text-paper transition-colors group-hover:text-lime">
                      {e.title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
