import type { NewsItem } from "@/features/news/types";

// Note: every item is signed by an ANTS author. We never credit the original
// wire source — refurbished news is presented as our own analysis. This is
// the entire point of the desk.

export const news: NewsItem[] = [
  {
    id: "N-2604-016",
    ts: "2026-04-07T14:18:00Z",
    author: "Anthony",
    headline: "BI holds 7DRR at 6.00%, governor signals USDIDR 16,000 is the line in the sand",
    impact: "high",
    bias: "bullish",
    affects: ["USDIDR", "JKSE", "INDOGB10Y", "BBCA"],
    analysis:
      "The 16,000 threshold matters more than the rate itself. BI has burned reserves to defend it twice this quarter. If USDIDR breaks 16,000 and BI doesn't intervene by the next session, the implicit cap is gone — and that's the trade, not the rate decision.",
    tags: ["risk-management"],
    relatedPlanIds: ["TP-2604-A", "TP-2604-B"],
  },
  {
    id: "N-2604-015",
    ts: "2026-04-07T13:55:00Z",
    author: "Anthony",
    headline: "JKSE foreign net buy +Rp 1.2T on the day, concentrated in big-four banks",
    impact: "medium",
    bias: "bullish",
    affects: ["JKSE", "BBCA", "BBRI", "BMRI", "BBNI"],
    analysis:
      "Foreign flow is the cleanest signal in IDX right now because local liquidity is thin. Concentration in BBCA / BBRI specifically (not spread across the board) tells you this is positioning for the BI decision, not generic bullishness. Watch for reversal on the close.",
    tags: ["mean-reversion", "developing-edge"],
  },
  {
    id: "N-2604-014",
    ts: "2026-04-07T13:42:00Z",
    author: "Anthony",
    headline: "Fed minutes signal divided committee on June cut as services inflation re-accelerates",
    impact: "high",
    bias: "bearish",
    affects: ["SPX", "NDX", "DXY", "US10Y"],
    analysis:
      "Hawkish dissent on the dot plot is the tell. Front-end yields lift first; equities rotate from duration-sensitive growth into defensives. Expect compressed vol-of-vol around 14:30 ET.",
    tags: ["risk-management"],
    relatedPlanIds: ["TP-2604-A"],
  },
  {
    id: "N-2604-013",
    ts: "2026-04-07T11:18:00Z",
    author: "Anthony",
    headline: "China PBoC injects ¥420B via 7-day reverse repo, largest single-day op since Jan",
    impact: "high",
    bias: "bullish",
    affects: ["HSI", "FXI", "CNH", "AUD"],
    analysis:
      "Liquidity backstop, not stimulus. Watch CNH fix tomorrow — if it holds <7.20 the trade is risk-on Asia. If it slips, fade the bounce in mainland names.",
    tags: ["mean-reversion"],
  },
  {
    id: "N-2604-012",
    ts: "2026-04-07T09:55:00Z",
    author: "Desk",
    headline: "Saudi Aramco trims May OSP for Asian buyers by $0.40/bbl, undercuts consensus",
    impact: "medium",
    bias: "bearish",
    affects: ["CL", "BZ", "XLE"],
    analysis:
      "Quiet demand signal. Refining margins compress before the headline crude reaction. Energy beta lags by 24-48h — that's where the trade lives, not in front-month crude.",
    tags: ["trend-following"],
  },
  {
    id: "N-2604-011",
    ts: "2026-04-07T08:30:00Z",
    author: "Anthony",
    headline: "BTC tags 71.2k overnight, perp funding flips negative for first time in 9 sessions",
    impact: "medium",
    bias: "neutral",
    affects: ["BTC", "ETH", "COIN"],
    analysis:
      "Funding flip without spot capitulation = squeeze setup, not reversal. Spot bid is steady; futures got cleaned out. Don't confuse the two.",
    tags: ["recency-bias", "mean-reversion"],
  },
  {
    id: "N-2604-010",
    ts: "2026-04-07T07:02:00Z",
    author: "Anthony",
    headline: "ECB's Lagarde pushes back on June cut bets in Frankfurt remarks",
    impact: "high",
    bias: "bearish",
    affects: ["EUR", "DAX", "EU2Y"],
    analysis:
      "Same script as the Fed — central banks are coordinating the walk-back. EUR/USD reaction will be the cleanest read; DAX is more about US flows than ECB.",
    tags: [],
  },
  {
    id: "N-2604-009",
    ts: "2026-04-07T06:14:00Z",
    author: "Anthony",
    headline: "BoJ said to discuss raising YCC ceiling at April meeting — sources",
    impact: "high",
    bias: "bullish",
    affects: ["JPY", "USDJPY", "JGB"],
    analysis:
      "Trial balloon. If it's leaked it's already decided. USDJPY 152 is the level the desk is watching.",
    tags: ["developing-edge"],
    relatedPlanIds: ["TP-2604-A", "TP-2603-D"],
  },
  {
    id: "N-2604-008",
    ts: "2026-04-06T22:48:00Z",
    author: "Anthony",
    headline: "Polymarket: 'Fed cuts in June' contract drifts from 64¢ to 41¢ in 4 hours",
    impact: "medium",
    bias: "bearish",
    affects: ["SPX", "ZN"],
    analysis:
      "Prediction markets repriced ahead of the FOMC minutes — someone knew. Pay attention to the sequencing, not the level.",
    tags: ["developing-edge"],
  },
  {
    id: "N-2604-007",
    ts: "2026-04-06T19:30:00Z",
    author: "Desk",
    headline: "TSMC reports March revenue +34% YoY, beating expectations",
    impact: "medium",
    bias: "bullish",
    affects: ["TSM", "SOX", "NDX"],
    analysis:
      "AI capex cycle is real and not slowing. The trade is no longer in TSM directly — it's in second-derivative names: power, cooling, fab equipment.",
    tags: ["trend-following"],
  },
];
