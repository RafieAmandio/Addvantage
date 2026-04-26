import { memo } from "react";
import Link from "next/link";
import { DataLabel, ImpactPill, BiasBadge } from "@/components/ui/Marker";
import { WatchPin } from "@/features/watchlist/components/WatchPin";
import { formatDate, formatTime, cn } from "@/lib/cn";
import type { TickerRollup } from "@/features/watchlist/types";

interface Props {
  rollup: TickerRollup;
  onUnpin: (ticker: string) => void;
}

function TickerCardImpl({ rollup, onUnpin }: Props) {
  const {
    ticker,
    newsItems,
    liveSetups,
    archiveSetups,
    totalR,
    closedCount,
  } = rollup;

  return (
    <section className="border border-gray-3 bg-gray-2/20">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-3 bg-gray-2/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <WatchPin ticker={ticker} size="md" />
          <div>
            <div className="font-display text-4xl italic text-brand">
              {ticker}
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
              {newsItems.length} news · {liveSetups.length} live ·{" "}
              {archiveSetups.length} historical
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {closedCount > 0 && (
            <div className="text-right">
              <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                Edge · {closedCount} closed
              </div>
              <div
                className={
                  "font-display text-2xl " +
                  (totalR > 0
                    ? "text-moss"
                    : totalR < 0
                    ? "text-blood-bright"
                    : "text-white/60")
                }
              >
                {(totalR >= 0 ? "+" : "") + totalR.toFixed(1)}R
              </div>
            </div>
          )}
          <button
            onClick={() => onUnpin(ticker)}
            className="border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/60 hover:border-blood hover:text-blood-bright focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ✕ Unpin
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
        <div>
          <DataLabel>Recent news · {newsItems.length}</DataLabel>
          {newsItems.length === 0 ? (
            <div className="mt-3 border border-gray-3 bg-black p-4 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              ● Nothing on the wire mentions {ticker} right now.
            </div>
          ) : (
            <div className="mt-3 space-y-px bg-gray-3">
              {newsItems.slice(0, 4).map((n) => {
                const ts = n.published_at ?? n.fetched_at;
                return (
                  <Link
                    key={n.id}
                    href={`/app/news/${n.id}`}
                    className="group block bg-black p-3 transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest2 text-brand">
                        [{n.source_code}]
                      </span>
                      <ImpactPill level={n.impact} />
                      <BiasBadge bias={n.bias} />
                      <span className="ml-auto font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                        {formatDate(ts)} · {formatTime(ts)}Z
                      </span>
                    </div>
                    <div className="mt-1 font-display text-base leading-snug text-white transition-colors group-hover:text-brand">
                      {n.headline}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {liveSetups.length > 0 && (
            <div>
              <DataLabel>Live setup · current plan</DataLabel>
              <div className="mt-3 space-y-px bg-gray-3">
                {liveSetups.map(({ plan: p, setup: s }) => (
                  <Link
                    key={`${p.id}-${s.id}`}
                    href={`/app/plan/${p.id}#${s.id}`}
                    className="group block bg-black p-3 transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest2 text-brand">
                        {p.id} · {s.id}
                      </span>
                      <span
                        className={
                          "font-mono text-[9px] uppercase tracking-widest2 " +
                          (s.direction === "long" ? "text-moss" : "text-brand")
                        }
                      >
                        {s.direction}
                      </span>
                      <span className="ml-auto border border-brand bg-brand/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-brand">
                        ● LIVE
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-white/70">
                      Entry {s.entry}
                    </div>
                    <div className="font-mono text-[10px] text-white/70">
                      Stop <span className="text-blood-bright">{s.stop}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {archiveSetups.length > 0 && (
            <div>
              <DataLabel>Historical · {archiveSetups.length}</DataLabel>
              <div className="mt-3 space-y-px bg-gray-3">
                {archiveSetups.map(({ plan: p, setup: s }) => {
                  const isWin = s.outcome === "win";
                  const isLoss =
                    s.outcome === "loss" || s.outcome === "stopped";
                  return (
                    <Link
                      key={`${p.id}-${s.id}`}
                      href={`/app/plan/${p.id}#${s.id}`}
                      className="group block bg-black p-3 transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                          {p.id} · {s.id}
                        </span>
                        <span
                          className={
                            "font-mono text-[9px] uppercase tracking-widest2 " +
                            (s.direction === "long"
                              ? "text-moss"
                              : "text-brand")
                          }
                        >
                          {s.direction}
                        </span>
                        <span className="ml-auto font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                          {formatDate(p.date)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between gap-2">
                        <div className="truncate font-mono text-[10px] text-white/60">
                          {s.rationale}
                        </div>
                        {s.outcomeR && (
                          <div
                            className={cn(
                              "shrink-0 font-display text-lg",
                              isWin
                                ? "text-moss"
                                : isLoss
                                ? "text-blood-bright"
                                : "text-white/60"
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
              <div className="mt-3 border border-gray-3 bg-black p-4 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                ● No setups on {ticker} in the current plan or archive.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export const TickerCard = memo(TickerCardImpl);
