import { notFound } from "next/navigation";
import {
  type Bar as ChartBar,
  type ChartMarker,
} from "@/features/chart/components/PriceChart";
import { ChartInteractive } from "@/features/chart/components/ChartInteractive";
import { SymbolNav } from "@/features/chart/components/SymbolNav";
import { SymbolSearch } from "@/features/chart/components/SymbolSearch";
import {
  IntervalPicker,
  isChartInterval,
  type ChartInterval,
} from "@/features/chart/components/IntervalPicker";
import { toChartBars } from "@/features/chart/lib/bars";
import { generateMockBars } from "@/features/chart/mock";
import { listBars } from "@/features/chart/queries/bars";
import {
  routeSymbolToCanonical,
  type RouteSymbol,
} from "@/features/chart/lib/symbols";
import { listTimelineEvents } from "@/features/timeline/queries/timeline";
import { LiveEventFeed } from "@/features/timeline/components/LiveEventFeed";

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
const DEFAULT_INTERVAL: ChartInterval = "1h";

export default async function ChartPage({
  params,
  searchParams,
}: {
  params: { symbol: string };
  searchParams?: { interval?: string };
}) {
  const symbol = params.symbol.toUpperCase();
  if (!isSupportedSymbol(symbol)) notFound();

  const intervalParam = searchParams?.interval;
  const interval: ChartInterval =
    intervalParam && isChartInterval(intervalParam)
      ? intervalParam
      : DEFAULT_INTERVAL;

  const to = new Date();
  const from = new Date(to.getTime() - DEFAULT_WINDOW_DAYS * 24 * 3600 * 1000);
  const canonical = routeSymbolToCanonical(symbol);
  // Bars + timeline are independent reads — fan out so total wait = max(t1, t2)
  // instead of t1 + t2. Both scope to the same window so the page tells one
  // consistent story.
  const [realBars, events] = await Promise.all([
    listBars({
      symbol: canonical,
      interval,
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

  // Project timeline events onto the chart as kind-styled dots. Show all
  // kinds — filtering lives in the sidebar feed, not here.
  const markers: ChartMarker[] = events.map((e) => ({
    id: e.id,
    time: e.occurred_at,
    kind: e.kind,
    title: e.title,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
            INSTRUMENT · TIMELINE
          </div>
          <h1 className="mt-1 font-display text-4xl text-paper sm:text-5xl">
            {symbol} <span className="italic text-lime">chart</span>
          </h1>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
            {usingMock ? "mock OHLC" : `real OHLC · ${interval}`} · {bars.length} bars · {events.length} events
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <SymbolNav
            symbols={SUPPORTED_SYMBOLS}
            current={symbol}
            className="flex-wrap"
          />
          <SymbolSearch
            symbols={SUPPORTED_SYMBOLS}
            current={symbol}
            hrefFor={(s) =>
              interval === DEFAULT_INTERVAL
                ? `/app/chart/${s}`
                : `/app/chart/${s}?interval=${interval}`
            }
          />
          <IntervalPicker
            current={interval}
            hrefFor={(i) =>
              i === DEFAULT_INTERVAL
                ? `/app/chart/${symbol}`
                : `/app/chart/${symbol}?interval=${i}`
            }
            className="flex-wrap"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          {usingMock && (
            <div className="mb-3 border border-amber-400/40 bg-amber-400/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-amber-400">
              [mock data — instrument_bars empty]
            </div>
          )}
          <ChartInteractive
            bars={bars}
            events={events}
            markers={markers}
            symbol={symbol}
            seriesType="candlestick"
            height={520}
          />
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <LiveEventFeed
            initialEvents={events}
            symbols={[symbol]}
            from={from.toISOString()}
            to={to.toISOString()}
            renderHeading={(n) => `Timeline · ${n} events`}
            emptyMessage={`No events for ${symbol} in window.`}
          />
        </aside>
      </div>
    </div>
  );
}
