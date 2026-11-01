import type { Outcome, PredictionCardData, PriceHistoryPoint } from "../types";

// Demo mode has no API, so the consensus panel reads Polymarket's public API
// directly (the same sources the worker syncs in production). Live odds, no key.
const GAMMA = "https://gamma-api.polymarket.com";
const CLOB = "https://clob.polymarket.com";

const DEMO_EVENTS = [
  { slug: "fed-decision-in-december-20260729232808632", category: "Fed", label: "Fed in December" },
  { slug: "bank-of-england-decision-in-november-20260730150602252", category: "BoE", label: "BoE this week" },
  { slug: "how-many-fed-rate-cuts-in-2026", category: "Fed", label: "Fed cuts in 2026" },
  { slug: "us-recession-by-end-of-2026", category: "Macro", label: "US recession" },
  { slug: "ecb-interest-rates-december-2026", category: "ECB", label: "ECB in December" },
  { slug: "what-price-will-xauusd-hit-in-november-2026", category: "Gold", label: "Gold in November" },
];

interface GammaMarket {
  question: string;
  groupItemTitle?: string | null;
  outcomePrices?: string;
  clobTokenIds?: string;
  oneWeekPriceChange?: number | null;
  closed?: boolean;
}
interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  volume?: number;
  liquidity?: number;
  markets?: GammaMarket[];
}

function outcomes(markets: GammaMarket[]): Outcome[] {
  const out: Outcome[] = [];
  for (const m of markets) {
    if (m.closed || !m.outcomePrices) continue;
    let yes = 0;
    let token: string | null = null;
    try {
      yes = Number((JSON.parse(m.outcomePrices) as string[])[0] ?? 0);
      token = (JSON.parse(m.clobTokenIds ?? "[]") as string[])[0] ?? null;
    } catch {
      continue;
    }
    out.push({
      label: m.groupItemTitle || m.question,
      probability: Math.round(yes * 1000) / 10,
      odds: yes > 0 ? Math.round((1 / yes) * 100) / 100 : 0,
      tokenId: token,
      weekChange: m.oneWeekPriceChange ?? null,
    });
  }
  return out
    .filter((o) => o.probability > 0 && o.probability < 100)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 10);
}

export async function demoPredictions(): Promise<PredictionCardData[]> {
  const now = new Date().toISOString();
  const cards = await Promise.all(
    DEMO_EVENTS.map(async (d, i): Promise<PredictionCardData | null> => {
      try {
        const res = await fetch(`${GAMMA}/events?slug=${d.slug}`, { next: { revalidate: 300 } });
        if (!res.ok) return null;
        const e = ((await res.json()) as GammaEvent[])[0];
        if (!e?.markets?.length) return null;
        const o = outcomes(e.markets);
        if (o.length === 0) return null;
        return {
          tracked: { id: `demo-${i}`, category: d.category, label: d.label, eventId: e.id, eventSlug: e.slug, eventTitle: e.title, sortOrder: i },
          outcomes: o,
          volume: e.volume ?? null,
          liquidity: e.liquidity ?? null,
          marketCount: e.markets.length,
          fetchedAt: now,
          weekRange: null,
          stale: false,
        };
      } catch {
        return null;
      }
    }),
  );
  return cards.filter((c): c is PredictionCardData => c !== null);
}

export async function demoHistory(tokenId: string): Promise<PriceHistoryPoint[]> {
  try {
    const res = await fetch(`${CLOB}/prices-history?market=${encodeURIComponent(tokenId)}&interval=max&fidelity=60`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return ((await res.json()) as { history?: PriceHistoryPoint[] }).history ?? [];
  } catch {
    return [];
  }
}
