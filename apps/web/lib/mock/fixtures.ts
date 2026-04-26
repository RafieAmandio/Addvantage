import type { NewsListItem } from "@/features/news/queries/news";
import type { Plan, ClosedPlanStats } from "@/features/plan/types";
import type { TimelineEvent } from "@/features/timeline/types";
import { news as mockNews } from "@/features/news/mock";
import { tradingPlans as mockPlans } from "@/features/plan/mock";
import { calendar as mockCalendar } from "@/features/calendar/mock";

function deriveSourceCode(author: string): string {
  // Prototype mocks use ANTS author names, not valid source_codes — truncate to fit the byline chip.
  return author.slice(0, 4).toUpperCase();
}

export function mockApprovedNews(): NewsListItem[] {
  return mockNews.map((n) => ({
    id: n.id,
    source_code: deriveSourceCode(n.author),
    headline: n.headline,
    analysis: n.analysis,
    impact: n.impact,
    bias: n.bias,
    affects: n.affects,
    tags: n.tags,
    author: n.author,
    published_at: n.ts,
    fetched_at: n.ts,
    related_plan_ids: n.relatedPlanIds ?? [],
  }));
}

export function mockApprovedNewsById(id: string): NewsListItem | null {
  return mockApprovedNews().find((n) => n.id === id) ?? null;
}

export function mockPublishedPlans(): Plan[] {
  return mockPlans.map((p, idx): Plan => {
    const primary = p.setups[0];
    const isLatest = idx === 0;
    return {
      id: p.id,
      symbol: primary?.instrument ?? "—",
      thesis: p.thesis,
      direction: primary?.direction ?? "long",
      entry: null,
      stop: null,
      target: null,
      r_multiple: null,
      setups: p.setups.map((s) => ({
        label: s.instrument,
        trigger: s.entry,
        invalidation: s.invalidation,
        note: s.rationale,
        // Extra prototype-only fields ride through via `.passthrough()`.
        instrument: s.instrument,
        direction: s.direction,
        bias: s.bias,
        entry: s.entry,
        stop: s.stop,
        targets: s.targets,
        rationale: s.rationale,
        confidence: s.confidence,
        tags: s.tags,
        ...(s.outcome ? { outcome: s.outcome } : {}),
        ...(s.outcomeNotes ? { outcomeNotes: s.outcomeNotes } : {}),
        ...(s.outcomeR ? { outcomeR: s.outcomeR } : {}),
      })),
      tags: Array.from(new Set(p.setups.flatMap((s) => s.tags))),
      tier: "free",
      status: isLatest ? "published" : "closed",
      outcome: isLatest ? null : "win",
      close_price: null,
      realized_r: isLatest ? null : 1.65,
      author_id: null,
      created_at: `${p.date}T08:00:00Z`,
      updated_at: `${p.date}T08:00:00Z`,
      published_at: `${p.date}T08:00:00Z`,
      closed_at: isLatest ? null : `${p.date}T20:00:00Z`,
    };
  });
}

export function mockPlanById(id: string): Plan | null {
  return mockPublishedPlans().find((p) => p.id === id) ?? null;
}

export function mockClosedPlanStats(): ClosedPlanStats {
  return {
    n: 24,
    winRate: 0.625,
    avgR: 0.84,
    byDirection: {
      long: { n: 11, winRate: 0.636, avgR: 0.92 },
      short: { n: 13, winRate: 0.615, avgR: 0.78 },
    },
  };
}

function regionToSymbol(region: string): string {
  switch (region) {
    case "US":
      return "USD";
    case "EU":
      return "EUR";
    case "UK":
      return "GBP";
    case "JP":
      return "JPY";
    case "CN":
      return "CNY";
    case "ID":
      return "IDR";
    default:
      return "GLOBAL";
  }
}

function macroEvents(): TimelineEvent[] {
  return mockCalendar.map(
    (e): TimelineEvent => ({
      id: e.id,
      kind: "macro",
      source_code: "FF",
      occurred_at: e.ts,
      symbols: [regionToSymbol(e.region)],
      title: e.title,
      body: e.notes ?? null,
      url: null,
      bias: null,
      impact: e.impact,
      news_item_id: e.relatedNewsId ?? null,
    })
  );
}

function newsTimelineEvents(): TimelineEvent[] {
  return mockNews.map(
    (n): TimelineEvent => ({
      id: `te-news-${n.id}`,
      kind: "news",
      source_code: deriveSourceCode(n.author),
      occurred_at: n.ts,
      symbols: n.affects,
      title: n.headline,
      body: n.analysis,
      url: null,
      bias: n.bias,
      impact: n.impact,
      news_item_id: n.id,
    })
  );
}

function tweetEvents(): TimelineEvent[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
  const seeds: Array<{
    h: number;
    symbols: string[];
    title: string;
    body: string;
    bias: "bullish" | "bearish" | "neutral";
    impact: "high" | "medium" | "low";
  }> = [
    {
      h: 2,
      symbols: ["SPX", "USD"],
      title: "We are going to have the GREATEST economy in HISTORY. Markets know it.",
      body: "Truth Social post. Coincides with pre-open futures squeeze.",
      bias: "bullish",
      impact: "medium",
    },
    {
      h: 8,
      symbols: ["DXY", "USD"],
      title: "China is manipulating their currency AGAIN. We will respond.",
      body: "DXY bid on tape immediately after — watch for intraday mean-reversion.",
      bias: "bullish",
      impact: "high",
    },
    {
      h: 26,
      symbols: ["BTC", "ETH"],
      title: "Crypto is the future. Bitcoin should be STRATEGIC reserve. Period.",
      body: "Typical pump-and-fade pattern — sized positions should cut into strength.",
      bias: "bullish",
      impact: "high",
    },
    {
      h: 52,
      symbols: ["GOLD", "USD"],
      title: "The Fed is DESTROYING our currency. Gold doesn't lie.",
      body: "Gold up 0.6% in Asia session; DXY flat — correlation decoupling.",
      bias: "bullish",
      impact: "medium",
    },
    {
      h: 74,
      symbols: ["SPX"],
      title: "Earnings are going to be HUGE. Mark my words. Dow 50,000 coming.",
      body: "Ahead of bank earnings — positioning skew already lopsided long.",
      bias: "bullish",
      impact: "low",
    },
    {
      h: 120,
      symbols: ["ETH", "BTC"],
      title: "ETF approvals were a GIFT. Now we need SEC gone completely.",
      body: "Flow data: ETH ETF net inflow +$42M, BTC ETF +$210M overnight.",
      bias: "bullish",
      impact: "medium",
    },
    {
      h: 168,
      symbols: ["DXY", "USD", "JPY"],
      title: "Japan is taking advantage. USD/JPY at these levels is UNACCEPTABLE.",
      body: "Verbal intervention rhetoric. Pair faded 80 pips in the hour.",
      bias: "bearish",
      impact: "high",
    },
    {
      h: 220,
      symbols: ["GOLD"],
      title: "Gold is the only honest money. Central banks know this.",
      body: "Gold testing 2,420 resistance — watch for momentum break + retest.",
      bias: "bullish",
      impact: "low",
    },
  ];
  return seeds.map((s, i) => ({
    id: `te-tweet-${i}`,
    kind: "tweet" as const,
    source_code: "TRUMP",
    occurred_at: hoursAgo(s.h),
    symbols: s.symbols,
    title: s.title,
    body: s.body,
    url: null,
    bias: s.bias,
    impact: s.impact,
    news_item_id: null,
  }));
}

export function mockTimelineEvents(): TimelineEvent[] {
  return [...macroEvents(), ...newsTimelineEvents(), ...tweetEvents()];
}
