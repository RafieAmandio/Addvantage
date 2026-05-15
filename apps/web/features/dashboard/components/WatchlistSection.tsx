import Link from "next/link";
import { WatchPin } from "@/features/watchlist/components/WatchPin";
import { cn } from "@/lib/cn";
import type { WatchArchiveEntry } from "@/features/dashboard/types";
import type { NewsListItem } from "@/features/news/queries/news";
import type { TradingSetup } from "@/features/plan/types";

const MOCK_CHANGES: Record<string, { price: number; pct: number }> = {
  NVDA: { price: 135.42, pct: 2.31 },
  AAPL: { price: 228.16, pct: -0.54 },
  TSLA: { price: 285.80, pct: 4.12 },
  MSFT: { price: 445.33, pct: 0.87 },
  GOOGL: { price: 178.05, pct: -1.22 },
  AMZN: { price: 205.44, pct: 1.45 },
  META: { price: 580.12, pct: 0.33 },
};

export function WatchlistSection({
  tickers,
  watchHydrated,
  watchNewsMentions,
  watchSetupMentions,
  watchArchiveSetups,
  planId,
  className,
}: {
  tickers: string[];
  watchHydrated: boolean;
  watchNewsMentions: NewsListItem[];
  watchSetupMentions: TradingSetup[];
  watchArchiveSetups: WatchArchiveEntry[];
  planId: string | null;
  className?: string;
}) {
  if (!watchHydrated) return null;

  return (
    <section aria-label="Watchlist" className={cn("border-b border-white/[0.06]", className)}>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-white/50">
            Watchlist{tickers.length > 0 ? ` (${tickers.length})` : ""}
          </h2>
          <Link
            href="/app/watchlist"
            className="text-xs text-brand hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Manage
          </Link>
        </div>

        {tickers.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] py-8 text-center">
            <p className="text-sm text-white/50">No instruments pinned yet.</p>
            <Link
              href="/app/watchlist"
              className="mt-2 inline-block text-xs text-brand hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              Add instruments to your watchlist
            </Link>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {tickers.map((t) => {
              const data = MOCK_CHANGES[t];
              const pct = data?.pct ?? 0;
              const positive = pct >= 0;
              return (
                <div
                  key={t}
                  className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs"
                >
                  <span className="font-medium text-white">{t}</span>
                  {data && (
                    <>
                      <span className="text-white/50">{data.price.toFixed(2)}</span>
                      <span className={positive ? "text-moss" : "text-brand"}>
                        {positive ? "+" : ""}{pct.toFixed(2)}%
                      </span>
                    </>
                  )}
                  <WatchPin ticker={t} />
                </div>
              );
            })}
          </div>
        )}

        {tickers.length > 0 && (watchNewsMentions.length > 0 || watchSetupMentions.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {watchNewsMentions.length > 0 && (
              <Link
                href="/app/news"
                className="rounded-lg bg-white/[0.03] px-3 py-2 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                {watchNewsMentions.length} news mention{watchNewsMentions.length !== 1 ? "s" : ""}
              </Link>
            )}
            {watchSetupMentions.length > 0 && planId && (
              <Link
                href={`/app/plan/${planId}`}
                className="rounded-lg bg-white/[0.03] px-3 py-2 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                {watchSetupMentions.length} active setup{watchSetupMentions.length !== 1 ? "s" : ""}
              </Link>
            )}
            {watchArchiveSetups.length > 0 && (
              <span className="px-3 py-2 text-white/40">
                {watchArchiveSetups.length} archived
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
