import { notFound } from "next/navigation";
import Link from "next/link";
import { PriceChart, type Bar as ChartBar } from "@/features/chart/components/PriceChart";
import { generateMockBars } from "@/features/chart/mock";
import { listBars } from "@/features/chart/queries/bars";
import {
  routeSymbolToCanonical,
  type RouteSymbol,
} from "@/features/chart/lib/symbols";
import { listTimelineEvents, type TimelineEvent } from "@/features/timeline/queries/timeline";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPPORTED_SYMBOLS: readonly RouteSymbol[] = [
  "SPX",
  "BTC",
  "ETH",
  "DXY",
  "GOLD",
];

function isSupportedSymbol(s: string): s is RouteSymbol {
  return (SUPPORTED_SYMBOLS as readonly string[]).includes(s);
}

const DEFAULT_WINDOW_DAYS = 30;
const DEFAULT_INTERVAL = "1h" as const;

function formatTime(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

function kindBadge(kind: TimelineEvent["kind"]): string {
  switch (kind) {
    case "news":
      return "bg-lime/15 text-lime";
    case "tweet":
      return "bg-amber-400/15 text-amber-400";
    case "macro":
      return "bg-blood/15 text-blood";
    case "earnings":
      return "bg-cyan-400/15 text-cyan-400";
    case "user_pin":
      return "bg-paper/15 text-paper/70";
  }
}

export default async function ChartPage({
  params,
}: {
  params: { symbol: string };
}) {
  const symbol = params.symbol.toUpperCase();
  if (!isSupportedSymbol(symbol)) notFound();

  const to = new Date();
  const from = new Date(to.getTime() - DEFAULT_WINDOW_DAYS * 24 * 3600 * 1000);
  const canonical = routeSymbolToCanonical(symbol);
  const realBars = await listBars({
    symbol: canonical,
    interval: DEFAULT_INTERVAL,
    from,
    to,
  });

  // Drop rows with null OHLC (DB columns are nullable) — PriceChart needs numbers.
  const chartBars: ChartBar[] = realBars.flatMap((b) => {
    if (b.open === null || b.high === null || b.low === null || b.close === null) {
      return [];
    }
    return [
      {
        time: b.ts,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume ?? undefined,
      },
    ];
  });

  const usingMock = chartBars.length === 0;
  const bars: ChartBar[] = usingMock ? generateMockBars(symbol) : chartBars;
  const sinceIso = bars[0]?.time;
  const events = await listTimelineEvents({
    symbols: [symbol],
    from: sinceIso,
    limit: 50,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
            INSTRUMENT · TIMELINE
          </div>
          <h1 className="mt-1 font-display text-5xl text-paper">
            {symbol} <span className="italic text-lime">chart</span>
          </h1>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
            {usingMock ? "mock OHLC" : `real OHLC · ${DEFAULT_INTERVAL}`} · {bars.length} bars · {events.length} events
          </div>
        </div>
        <nav className="flex gap-2 font-mono text-[10px] uppercase tracking-widest2">
          {[...SUPPORTED_SYMBOLS].map((s) => (
            <Link
              key={s}
              href={`/app/chart/${s}`}
              className={
                "border px-2 py-1 transition-colors " +
                (s === symbol
                  ? "border-lime bg-lime text-ink"
                  : "border-ink-3 text-paper/60 hover:border-lime hover:text-lime")
              }
            >
              {s}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          {usingMock && (
            <div className="mb-3 border border-amber-400/40 bg-amber-400/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-amber-400">
              [mock data — instrument_bars empty]
            </div>
          )}
          <div className="border border-ink-3 bg-ink-2 p-3">
            <PriceChart bars={bars} seriesType="candlestick" height={520} />
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <div className="border border-ink-3 bg-ink-2">
            <div className="border-b border-ink-3 px-4 py-3 font-mono text-[10px] uppercase tracking-widest2 text-paper/60">
              Timeline · {events.length} events
            </div>
            {events.length === 0 ? (
              <div className="px-4 py-8 text-center font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                No events for {symbol} in window.
              </div>
            ) : (
              <ul className="divide-y divide-ink-3 max-h-[520px] overflow-y-auto">
                {events.map((e) => {
                  const href = e.news_item_id
                    ? `/app/news/${e.news_item_id}`
                    : e.url ?? null;
                  const inner = (
                    <div className="px-4 py-3 hover:bg-ink-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            "px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 " +
                            kindBadge(e.kind)
                          }
                        >
                          {e.kind}
                        </span>
                        {e.source_code && (
                          <span className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
                            [{e.source_code}]
                          </span>
                        )}
                        <span className="ml-auto font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                          {formatTime(e.occurred_at)}
                        </span>
                      </div>
                      <div className="mt-1.5 text-sm leading-snug text-paper">
                        {e.title}
                      </div>
                    </div>
                  );
                  return (
                    <li key={e.id}>
                      {href ? (
                        <Link href={href} className="block">
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
