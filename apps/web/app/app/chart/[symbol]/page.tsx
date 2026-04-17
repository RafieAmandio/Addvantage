import { notFound } from "next/navigation";
import { PriceChart, type Bar as ChartBar } from "@/features/chart/components/PriceChart";
import { SymbolNav } from "@/features/chart/components/SymbolNav";
import { toChartBars } from "@/features/chart/lib/bars";
import { generateMockBars } from "@/features/chart/mock";
import { listBars } from "@/features/chart/queries/bars";
import {
  routeSymbolToCanonical,
  type RouteSymbol,
} from "@/features/chart/lib/symbols";
import { listTimelineEvents } from "@/features/timeline/queries/timeline";
import { EventFeed } from "@/features/timeline/components/EventFeed";

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
  // Bars + timeline are independent reads — fan out so total wait = max(t1, t2)
  // instead of t1 + t2. Both scope to the same window so the page tells one
  // consistent story.
  const [realBars, events] = await Promise.all([
    listBars({
      symbol: canonical,
      interval: DEFAULT_INTERVAL,
      from,
      to,
    }),
    listTimelineEvents({
      symbols: [symbol],
      from: from.toISOString(),
      to: to.toISOString(),
      limit: 50,
    }),
  ]);

  const chartBars = toChartBars(realBars);
  const usingMock = chartBars.length === 0;
  const bars: ChartBar[] = usingMock ? generateMockBars(symbol) : chartBars;

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
        <SymbolNav symbols={SUPPORTED_SYMBOLS} current={symbol} />
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
          <EventFeed
            events={events}
            heading={`Timeline · ${events.length} events`}
            emptyMessage={`No events for ${symbol} in window.`}
          />
        </aside>
      </div>
    </div>
  );
}
