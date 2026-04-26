import type { Bar } from "./components/PriceChart";

export function generateMockBars(
  symbol: string,
  opts: { hours?: number; basePrice?: number } = {}
): Bar[] {
  const hours = opts.hours ?? 30 * 24; // 30 days hourly
  const basePrice = opts.basePrice ?? seededBase(symbol);
  const rng = mulberry32(hashString(symbol));

  const now = Date.now();
  const startMs = now - hours * 3600 * 1000;
  const bars: Bar[] = [];
  let close = basePrice;

  for (let i = 0; i < hours; i++) {
    const ts = startMs + i * 3600 * 1000;
    const drift = (rng() - 0.5) * basePrice * 0.004; // ±0.4% per hour
    const open = close;
    const target = open + drift;
    const high = Math.max(open, target) + rng() * basePrice * 0.0015;
    const low = Math.min(open, target) - rng() * basePrice * 0.0015;
    close = target;
    bars.push({
      time: new Date(ts).toISOString(),
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume: Math.floor(rng() * 1_000_000),
    });
  }
  return bars;
}

function seededBase(symbol: string): number {
  switch (symbol.toUpperCase()) {
    case "SPX":
      return 5000;
    case "BTC":
      return 60000;
    case "ETH":
      return 3000;
    case "DXY":
      return 104;
    case "GOLD":
      return 2400;
    default:
      return 50 + (hashString(symbol) % 450);
  }
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
