import type { Bar } from "@/features/chart/components/PriceChart";
import type { TimelineKind } from "@/features/timeline/types";

export interface MockEvent {
  id: string;
  time: string;
  kind: TimelineKind;
  title: string;
  body: string | null;
  sourceCode: string | null;
  bias: "bullish" | "bearish" | "neutral" | null;
  impact: "high" | "medium" | "low" | null;
  newsItemId: string | null;
}

const SYMBOLS = ["NVDA", "AAPL", "TSLA", "MSFT", "GOOGL", "AMZN", "META"] as const;
export type MockSymbol = (typeof SYMBOLS)[number];
export { SYMBOLS };

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateBars(
  count: number,
  startPrice: number,
  startDate: Date,
  intervalMs: number,
  seed: number,
): Bar[] {
  const rng = seededRandom(seed);
  const bars: Bar[] = [];
  let price = startPrice;

  for (let i = 0; i < count; i++) {
    const d = new Date(startDate.getTime() + i * intervalMs);
    const volatility = price * 0.025;
    const open = price + (rng() - 0.5) * volatility * 0.3;
    const close = open + (rng() - 0.48) * volatility;
    const high = Math.max(open, close) + rng() * volatility * 0.5;
    const low = Math.min(open, close) - rng() * volatility * 0.5;
    price = close;

    const pad = (n: number) => String(n).padStart(2, "0");
    const timeStr =
      intervalMs >= 86400000
        ? `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
        : d.toISOString();

    bars.push({
      time: timeStr,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
    });
  }
  return bars;
}

const SYMBOL_SEEDS: Record<MockSymbol, { price: number; seed: number }> = {
  NVDA: { price: 135, seed: 42 },
  AAPL: { price: 228, seed: 73 },
  TSLA: { price: 285, seed: 19 },
  MSFT: { price: 445, seed: 88 },
  GOOGL: { price: 178, seed: 55 },
  AMZN: { price: 205, seed: 31 },
  META: { price: 580, seed: 66 },
};

export type Timeframe = "1D" | "1W" | "1M";

export function getMockBars(symbol: MockSymbol, tf: Timeframe): Bar[] {
  const cfg = SYMBOL_SEEDS[symbol];
  const now = new Date();

  switch (tf) {
    case "1D": {
      const start = new Date(now);
      start.setUTCHours(0, 0, 0, 0);
      return generateBars(24, cfg.price, start, 3600000, cfg.seed);
    }
    case "1W": {
      const start = new Date(now);
      start.setUTCDate(start.getUTCDate() - 6);
      start.setUTCHours(0, 0, 0, 0);
      return generateBars(7 * 8, cfg.price, start, 3600000, cfg.seed + 1);
    }
    case "1M": {
      const start = new Date(now);
      start.setUTCDate(start.getUTCDate() - 29);
      start.setUTCHours(0, 0, 0, 0);
      return generateBars(30, cfg.price, start, 86400000, cfg.seed + 2);
    }
  }
}

const EVENT_POOL: Array<Omit<MockEvent, "id" | "time">> = [
  {
    kind: "news",
    title: "NVDA beats Q4 estimates, data center revenue up 93%",
    body: "Revenue $22.1B vs $20.6B expected. Guidance above consensus.",
    sourceCode: "SC",
    bias: "bullish",
    impact: "high",
    newsItemId: null,
  },
  {
    kind: "macro",
    title: "Fed holds rates steady at 5.25-5.50%",
    body: "Powell signals cuts likely in H2. Dot plot unchanged.",
    sourceCode: "FRED",
    bias: "neutral",
    impact: "high",
    newsItemId: null,
  },
  {
    kind: "tweet",
    title: "Trump: 'Tariffs on chips coming very soon'",
    body: "Posted on Truth Social. Semi sector reacted immediately.",
    sourceCode: "TRUMP",
    bias: "bearish",
    impact: "high",
    newsItemId: null,
  },
  {
    kind: "earnings",
    title: "AAPL earnings call: Services revenue record high",
    body: "Services $24.2B. iPhone slightly below. Buyback expanded.",
    sourceCode: "SC",
    bias: "bullish",
    impact: "medium",
    newsItemId: null,
  },
  {
    kind: "news",
    title: "Japan intervenes in FX market, USD/JPY drops 3%",
    body: "BOJ confirmed intervention after yen hit 160. Risk-off wave.",
    sourceCode: "RBC",
    bias: "bearish",
    impact: "high",
    newsItemId: null,
  },
  {
    kind: "macro",
    title: "US CPI comes in at 3.2%, below expectations",
    body: "Core CPI 3.8% vs 3.9% expected. Bond yields drop.",
    sourceCode: "FRED",
    bias: "bullish",
    impact: "medium",
    newsItemId: null,
  },
  {
    kind: "tweet",
    title: "Elon: 'Robotaxi reveal next month'",
    body: null,
    sourceCode: "TRUMP",
    bias: "bullish",
    impact: "low",
    newsItemId: null,
  },
  {
    kind: "earnings",
    title: "MSFT Azure growth accelerates to 31%",
    body: "AI services contribution growing. Capex guidance raised.",
    sourceCode: "SC",
    bias: "bullish",
    impact: "medium",
    newsItemId: null,
  },
  {
    kind: "news",
    title: "EU approves new semiconductor subsidy package",
    body: "€8B in subsidies for chip manufacturing in Europe.",
    sourceCode: "RBC",
    bias: "bullish",
    impact: "low",
    newsItemId: null,
  },
  {
    kind: "macro",
    title: "NFP: 303K jobs added, unemployment falls to 3.8%",
    body: "Much stronger than expected. Rate cut odds fall.",
    sourceCode: "FRED",
    bias: "bearish",
    impact: "medium",
    newsItemId: null,
  },
];

export function getMockEvents(bars: Bar[]): MockEvent[] {
  if (bars.length < 3) return [];
  const events: MockEvent[] = [];
  const step = Math.max(1, Math.floor(bars.length / 8));

  for (let i = 0; i < EVENT_POOL.length && i * step < bars.length; i++) {
    const barIdx = Math.min(i * step + 1, bars.length - 1);
    const bar = bars[barIdx];
    events.push({
      ...EVENT_POOL[i],
      id: `mock-event-${i}`,
      time: bar.time,
    });
  }
  return events;
}
