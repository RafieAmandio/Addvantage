import Link from "next/link";
import { cn } from "@/lib/cn";
import { Panel, PanelLink } from "@/components/ui/Panel";
import { WatchPin } from "@/features/watchlist/components/WatchPin";
import type { AtrPair } from "@/features/atr/types";
import type { WatchArchiveEntry } from "@/features/dashboard/types";
import type { NewsListItem } from "@/features/news/queries/news";
import type { TradingSetup } from "@/features/plan/types";
import { dayChange, fmtPrice } from "./PriceStrip";

/** Pinned tickers with live prices where the ATR scanner covers them, plus what mentions them. */
export function WatchlistSection({
  tickers,
  pairs,
  watchHydrated,
  watchNewsMentions,
  watchSetupMentions,
  watchArchiveSetups,
  planId,
}: {
  tickers: string[];
  pairs: AtrPair[];
  watchHydrated: boolean;
  watchNewsMentions: NewsListItem[];
  watchSetupMentions: TradingSetup[];
  watchArchiveSetups: WatchArchiveEntry[];
  planId: string | null;
}) {
  if (!watchHydrated) return null;
  const bySym = new Map(pairs.map((p) => [p.symbol.replace("/", ""), p]));

  return (
    <Panel
      title={`Watchlist${tickers.length ? ` · ${tickers.length}` : ""}`}
      sub={
        tickers.length === 0 ? "Pin instruments to follow them here" : (
          <>
            {watchNewsMentions.length} news mention{watchNewsMentions.length === 1 ? "" : "s"}
            {" · "}
            {planId && watchSetupMentions.length > 0 ? (
              <Link href={`/app/plan/${planId}`} className="text-brand hover:underline">
                {watchSetupMentions.length} active setup{watchSetupMentions.length === 1 ? "" : "s"}
              </Link>
            ) : (
              "no active setups"
            )}
            {watchArchiveSetups.length > 0 && ` · ${watchArchiveSetups.length} archived`}
          </>
        )
      }
      action={<PanelLink href="/app/watchlist">Manage</PanelLink>}
    >
      {tickers.length === 0 ? (
        <Link href="/app/watchlist" className="text-[14px] text-brand hover:underline">
          Add instruments
        </Link>
      ) : (
        <ul className="-my-1 divide-y divide-white/[0.07]">
          {tickers.map((t) => {
            const p = bySym.get(t.replace("/", "").toUpperCase());
            const ch = p ? dayChange(p) : null;
            return (
              <li key={t} className="flex items-center gap-3 py-2.5">
                <Link href={`/app/instrument/${encodeURIComponent(t)}`} className="min-w-0 flex-1 text-[14px] font-semibold text-white hover:text-brand">
                  {t}
                </Link>
                {p ? (
                  <div className="text-right">
                    <div className="font-num text-[20px] font-semibold leading-5 text-white">{fmtPrice(p.price ?? p.dailyClose)}</div>
                    <div className={cn("text-[12px] font-medium", ch! >= 0 ? "text-up" : "text-down")}>
                      {ch! >= 0 ? "▲" : "▼"} {Math.abs(ch!).toFixed(2)}%
                    </div>
                  </div>
                ) : (
                  <span className="text-[12px] text-white/30">No price feed</span>
                )}
                <WatchPin ticker={t} />
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
