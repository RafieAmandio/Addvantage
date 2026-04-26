import Link from "next/link";
import { DataLabel, ImpactPill, BiasBadge } from "@/components/ui/Marker";
import { WatchPin } from "@/features/watchlist/components/WatchPin";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import type { WatchArchiveEntry } from "@/features/dashboard/types";
import type { NewsListItem } from "@/features/news/queries/news";
import type { TradingSetup } from "@/features/plan/types";
import { cn } from "@/lib/cn";

export function WatchlistSection({
  tickers,
  watchNewsMentions,
  watchSetupMentions,
  watchArchiveSetups,
  planId,
  className,
}: {
  tickers: string[];
  watchNewsMentions: NewsListItem[];
  watchSetupMentions: TradingSetup[];
  watchArchiveSetups: WatchArchiveEntry[];
  planId: string;
  className?: string;
}) {
  return (
    <section
      className={cn("border-b border-gray-3 bg-gray-2/20", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <SectionHeader n="—" label="WATCHLIST" right={`${tickers.length} pinned`}>
          <div className="flex flex-wrap items-center gap-1.5">
            {tickers.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 border border-brand/40 bg-brand/5 py-0.5 pl-2 pr-1 font-mono text-[10px] uppercase tracking-widest2 text-brand"
              >
                {t}
                <WatchPin ticker={t} />
              </span>
            ))}
            <Link
              href="/app/watchlist"
              className="ml-2 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:underline focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Manage all →
            </Link>
          </div>
        </SectionHeader>

        <div className="mt-4 grid grid-cols-12 gap-4 sm:gap-6">
          <div className="col-span-12 lg:col-span-7">
            <DataLabel>News touching your pins</DataLabel>
            {watchNewsMentions.length === 0 ? (
              <div className="mt-3 border border-gray-3 bg-black p-5 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                ● Nothing in today&apos;s wire mentions{" "}
                {tickers.map((t, i) => (
                  <span key={t} className="text-brand">
                    {i > 0 ? " · " : ""}
                    {t}
                  </span>
                ))}
                . The desk will ping you when it does.
              </div>
            ) : (
              <div className="mt-3 space-y-px bg-gray-3">
                {watchNewsMentions.slice(0, 3).map((n) => {
                  const hits = n.affects.filter((a) => tickers.includes(a));
                  return (
                    <Link
                      key={n.id}
                      href={`/app/news/${n.id}`}
                      className="group block bg-black p-4 transition-all hover:-translate-y-px hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                          [{n.source_code}]
                        </span>
                        <ImpactPill level={n.impact} />
                        <BiasBadge bias={n.bias} />
                        <span className="ml-auto flex gap-1">
                          {hits.map((h) => (
                            <span
                              key={h}
                              className="border border-brand bg-brand/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-brand"
                            >
                              ★ {h}
                            </span>
                          ))}
                        </span>
                      </div>
                      <div className="mt-2 font-display text-lg leading-snug text-white transition-colors group-hover:text-brand">
                        {n.headline}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="col-span-12 lg:col-span-5">
            <DataLabel>Live setups on your pins</DataLabel>
            {watchSetupMentions.length === 0 ? (
              <div className="mt-3 border border-gray-3 bg-black p-5 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                ● No setups on your pinned instruments in the current plan.
              </div>
            ) : (
              <div className="mt-3 space-y-px bg-gray-3">
                {watchSetupMentions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/app/plan/${planId}#${s.id}`}
                    className="group block bg-black p-4 transition-all hover:-translate-y-px hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                        {s.id}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-widest2",
                          s.direction === "long" ? "text-moss" : "text-brand"
                        )}
                      >
                        ★ {s.instrument} · {s.direction}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-white/70">
                      Entry <span className="text-white">{s.entry}</span> · Stop{" "}
                      <span className="text-blood-bright">{s.stop}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {watchArchiveSetups.length > 0 && (
              <div className="mt-6">
                <DataLabel>Edge on your pins · archive</DataLabel>
                <div className="mt-3 space-y-px bg-gray-3">
                  {watchArchiveSetups.map(({ plan: p, setup: s }) => {
                    const outcome = s.outcome ?? "open";
                    const isWin = outcome === "win";
                    const isLoss = outcome === "loss" || outcome === "stopped";
                    return (
                      <Link
                        key={`${p.id}-${s.id}`}
                        href={`/app/plan/${p.id}#${s.id}`}
                        className="group block bg-black p-3 transition-all hover:-translate-y-px hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/50">
                                {p.id} · {s.id}
                              </span>
                              <span
                                className={cn(
                                  "font-mono text-[10px] uppercase tracking-widest2",
                                  s.direction === "long"
                                    ? "text-moss"
                                    : "text-brand"
                                )}
                              >
                                ★ {s.instrument}
                              </span>
                            </div>
                            <div className="mt-0.5 truncate font-mono text-[10px] text-white/50">
                              {s.rationale}
                            </div>
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
          </div>
        </div>
      </div>
    </section>
  );
}
