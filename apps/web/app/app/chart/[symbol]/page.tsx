import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateMetadata({
  params,
}: {
  params: { symbol: string };
}): Metadata {
  return { title: `${params.symbol.toUpperCase()} Chart` };
}
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

  const markers: ChartMarker[] = events.map((e) => ({
    id: e.id,
    time: e.occurredAt,
    kind: e.kind,
    title: e.title,
    sourceCode: e.sourceCode,
    body: e.body,
    bias: e.bias,
    impact: e.impact,
  }));

  return (
    <div className="stagger mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            INSTRUMENT · TIMELINE
          </div>
          <h1 className="mt-1 font-display text-4xl text-white sm:text-5xl">
            {symbol} <span className="italic text-brand">chart</span>
          </h1>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            {usingMock ? "mock OHLC" : `real OHLC · ${interval}`} · {bars.length} bars · {events.length} events
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <SymbolNav
            symbols={SUPPORTED_SYMBOLS}
            current={symbol}
            className="flex-wrap"
          />
          <SymbolSearch symbols={SUPPORTED_SYMBOLS} current={symbol} />
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

      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        <div className="col-span-12 lg:col-span-8">
          {usingMock && (
            <div className="mb-3 border border-brand/40 bg-brand/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-brand">
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
            headingPrefix="Timeline"
            emptyMessage={`No events for ${symbol} in window.`}
          />
        </aside>
      </div>
    </div>
  );
}
