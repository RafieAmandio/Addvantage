import { memo } from "react";
import Link from "next/link";
import { WatchPin } from "@/features/watchlist/components/WatchPin";
import { dayChange, fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { splitLevel } from "@/features/plan/lib/detail-helpers";
import { cn } from "@/lib/cn";
import type { AtrPair } from "@/features/atr/types";
import type { TickerRollup } from "@/features/watchlist/types";

interface Props {
  rollup: TickerRollup;
  pair?: AtrPair;
  onUnpin: (ticker: string) => void;
}

/** One pinned instrument as a list row: price, live setups, archive R, latest mention. */
function TickerCardImpl({ rollup, pair, onUnpin }: Props) {
  const { ticker, newsItems, liveSetups, archiveSetups, totalR, closedCount } = rollup;
  const ch = pair ? dayChange(pair) : null;
  const latestNews = newsItems[0];

  return (
    <li className="py-3.5">
      <div className="flex items-center gap-2">
        <Link
          href={`/app/instrument/${encodeURIComponent(ticker)}`}
          className="min-w-0 truncate text-[17px] font-semibold text-white hover:text-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          {ticker}
        </Link>
        <WatchPin ticker={ticker} />
        <div className="ml-auto text-right">
          {pair ? (
            <div className="flex items-baseline justify-end gap-2">
              <span className="font-num text-[24px] font-semibold leading-7 text-white">{fmtPrice(pair.price ?? pair.dailyClose)}</span>
              <span className={cn("w-16 text-[12px] font-medium", ch! >= 0 ? "text-up" : "text-down")}>
                {ch! >= 0 ? "▲" : "▼"} {Math.abs(ch!).toFixed(2)}%
              </span>
            </div>
          ) : (
            <span className="text-[12px] text-white/30">No price feed</span>
          )}
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
        {liveSetups.map(({ plan: p, setup: s }) => (
          <Link
            key={`${p.id}-${s.id}`}
            href={`/app/plan/${p.id}#${s.id}`}
            className={cn("font-medium hover:underline", s.direction === "long" ? "text-up" : "text-down")}
          >
            {s.direction === "long" ? "▲ Long" : "▼ Short"} from {splitLevel(s.entry).figure || s.entry}
          </Link>
        ))}
        <span className="text-white/55">
          {newsItems.length} news
        </span>
        {archiveSetups.length > 0 && (
          <span className="text-white/55">
            {archiveSetups.length} past setup{archiveSetups.length === 1 ? "" : "s"}
            {closedCount > 0 && (
              <span className={cn("ml-1.5 font-num text-[15px] font-semibold", totalR > 0 ? "text-up" : totalR < 0 ? "text-down" : "text-white/55")}>
                {(totalR >= 0 ? "+" : "") + totalR.toFixed(1)}R
              </span>
            )}
          </span>
        )}
        <button
          onClick={() => onUnpin(ticker)}
          className="ml-auto text-[12px] text-white/30 transition-colors hover:text-down focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          Unpin
        </button>
      </div>

      {latestNews && (
        <Link
          href={`/app/news/${latestNews.id}`}
          className="mt-1 block truncate text-[14px] text-white/55 transition-colors hover:text-white"
        >
          <span className="text-white/30">{latestNews.sourceCode} · </span>
          {latestNews.headline}
        </Link>
      )}
    </li>
  );
}

export const TickerCard = memo(TickerCardImpl);
