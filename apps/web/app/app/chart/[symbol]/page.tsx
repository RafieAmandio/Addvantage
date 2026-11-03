import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Panel } from "@/components/ui/Panel";

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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel
        title={<span className="font-num text-[28px] font-semibold leading-8">{symbol}</span>}
        sub={
          usingMock
            ? `Sample bars, nothing stored for ${symbol} yet · ${events.length} events`
            : `${interval} candles · ${bars.length} bars · ${events.length} events`
        }
        action={<SymbolSearch symbols={SUPPORTED_SYMBOLS} current={symbol} />}
      >
        <ChartInteractive
          bars={bars}
          events={events}
          markers={markers}
          symbol={symbol}
          seriesType="candlestick"
          height={520}
          toolbar={
            <>
              <SymbolNav symbols={SUPPORTED_SYMBOLS} current={symbol} />
              <IntervalPicker
                current={interval}
                hrefFor={(i) => (i === DEFAULT_INTERVAL ? `/app/chart/${symbol}` : `/app/chart/${symbol}?interval=${i}`)}
              />
            </>
          }
        />
      </Panel>

      <aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
        <LiveEventFeed
          initialEvents={events}
          symbols={[symbol]}
          from={from.toISOString()}
          to={to.toISOString()}
          headingPrefix="Timeline"
          emptyMessage={`No events for ${symbol} in this window.`}
        />
      </aside>
    </div>
  );
}
