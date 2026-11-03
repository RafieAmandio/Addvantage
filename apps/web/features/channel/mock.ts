// Mock mode only: desk broadcasts for /app/channel and the intel map. Times are offsets
// from now so the feed always reads as live.
const THREADS = [
  { id: "th-gold", title: "Gold desk", slug: "gold", description: "XAUUSD levels, flows and the ATR map, updated through London and New York." },
  { id: "th-fx", title: "FX majors", slug: "fx", description: "EURUSD, GBPUSD, USDJPY and the dollar index." },
  { id: "th-macro", title: "Macro and data", slug: "macro", description: "What the calendar means for positioning, before and after the print." },
  { id: "th-crypto", title: "Crypto", slug: "crypto", description: "BTC and ETH structure, funding and ETF flows." },
];

const SEEDS: { m: number; thread: string; pinned?: boolean; tags: string[]; body: string }[] = [
  { m: 18, thread: "th-gold", pinned: true, tags: ["precious-metals", "volatility"], body: "Gold is pressing the 3,879 low left by the 159 dollar range day. First job is to see if 3,872 holds into London. A reclaim of 3,912 puts the 3,951 shelf back in play; acceptance below 3,860 and we stop looking for longs today." },
  { m: 47, thread: "th-fx", tags: ["forex", "central-banks"], body: "USDJPY back at 157.5. The 158.00 to 158.40 band is where the MoF talked last time. Not shorting the trend blind, but no new longs above 158 without a pullback first." },
  { m: 95, thread: "th-macro", tags: ["economic-data", "inflation"], body: "Calendar check: ISM and the jobs data are the big prints this week. Expect the dollar to drift ahead of it and range trade in EURUSD between 1.1140 and 1.1220 until then." },
  { m: 160, thread: "th-crypto", tags: ["crypto", "liquidity"], body: "BTC holding 77k on thin volume. Funding flat, open interest down 4% in three days. The flush already happened; 76.2k is the level that matters if it comes back." },
  { m: 240, thread: "th-fx", tags: ["forex", "momentum"], body: "GBPUSD is sitting at 1.3393, right on the 20 day average. Cable is the cleanest dollar read this week: above 1.3450 the bounce is real, below 1.3350 it was a dead cat." },
  { m: 380, thread: "th-gold", tags: ["precious-metals", "safe-haven"], body: "Gold weekly read: lower high at 4,038, close near the lows. The weekly structure is still bullish above 3,790 but the daily is not. Smaller size until those two agree again." },
  { m: 620, thread: "th-macro", tags: ["energy", "commodities"], body: "WTI holding above 104. Energy is now the main inflation story for the front end. Watch breakevens before you fade the dollar." },
  { m: 1310, thread: "th-macro", pinned: true, tags: ["monetary-policy", "interest-rates"], body: "House rule reminder for event weeks: no new positions in the 15 minutes before a high impact print, and half size for the first hour after. The edge is in the second move, not the first." },
  { m: 1520, thread: "th-fx", tags: ["forex", "risk-off"], body: "EURUSD failed again at 1.1217. Third rejection this month. Shorts from the top of the range already paid a clean 1R; trail the rest above 1.1200." },
  { m: 1745, thread: "th-gold", tags: ["precious-metals", "volatility"], body: "Gold just printed an exceeded ATR day. Historically the next session ranges smaller. Do not chase the open; let the first hour build a range and trade the edges." },
  { m: 2890, thread: "th-crypto", tags: ["crypto", "regulation"], body: "ETF flows have been negative two sessions in a row. Not a reason to short, but it is a reason to stop buying every dip into resistance." },
  { m: 4320, thread: "th-macro", tags: ["equities", "earnings"], body: "Big tech earnings are done. NDX held 28,000 on the reaction, which is constructive. SPX needs to clear 7,640 to make new highs this month." },
];

export interface MockChannelPost {
  id: string;
  author: string;
  body: string;
  imageUrl: string | null;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  thread: { id: string; title: string; slug: string } | null;
}

export function mockChannelThreads() {
  return THREADS;
}

export function mockChannelPosts(threadId?: string | null): MockChannelPost[] {
  const now = Date.now();
  return SEEDS.filter((s) => !threadId || s.thread === threadId).map((s, i) => {
    const t = THREADS.find((x) => x.id === s.thread)!;
    return {
      id: `cp-${i + 1}`,
      author: "Desk",
      body: s.body,
      imageUrl: null,
      tags: s.tags,
      pinned: !!s.pinned,
      createdAt: new Date(now - s.m * 60_000).toISOString(),
      thread: { id: t.id, title: t.title, slug: t.slug },
    };
  });
}
