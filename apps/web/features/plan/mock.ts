import type { TradingPlan, Plan } from "@/lib/mock/types";

export const tradingPlans: TradingPlan[] = [
  {
    id: "TP-2604-A",
    date: "2026-04-07",
    horizon: "swing",
    thesis:
      "Macro is repricing the cut path. Front-end yields rise, growth de-rates, defensives bid. Asia liquidity backstop creates a tactical long window in HSI but the structural read is still rotation, not risk-on. Energy lag trade is the cleanest expression — short-dated calls on XLE underperformers, sized small.",
    authoredBy: "Anthony",
    setups: [
      {
        id: "S-01",
        instrument: "ES1!",
        direction: "short",
        bias: "bearish",
        entry: "5,232 — 5,248 zone",
        stop: "5,266 (above prior swing)",
        targets: ["5,184", "5,142", "5,098 stretch"],
        invalidation: "Sustained 15m close above 5,266. Don't average.",
        rationale:
          "Distribution at the highs into FOMC minutes. Breadth deteriorating, equal-weight diverging from cap-weight, VIX term curve flattening.",
        confidence: 4,
        tags: ["risk-management", "trend-following"],
      },
      {
        id: "S-02",
        instrument: "USDJPY",
        direction: "short",
        bias: "bearish",
        entry: "152.10 — 152.40",
        stop: "152.85",
        targets: ["151.20", "150.50"],
        invalidation: "BoJ minutes leak proves false / no YCC mention.",
        rationale:
          "Reuters trial balloon on YCC ceiling. Asymmetric — even a no-change with hawkish language carries it.",
        confidence: 3,
        tags: ["developing-edge"],
      },
      {
        id: "S-03",
        instrument: "HSI",
        direction: "long",
        bias: "bullish",
        entry: "16,820 retest",
        stop: "16,640",
        targets: ["17,150", "17,420"],
        invalidation: "CNH fix above 7.22 tomorrow morning.",
        rationale:
          "PBoC repo op is large enough to matter for a 2-3 day window. This is a rental, not a marriage.",
        confidence: 3,
        tags: ["mean-reversion"],
      },
      {
        id: "S-04",
        instrument: "BBCA",
        direction: "long",
        bias: "bullish",
        entry: "9,750 — 9,800 zone",
        stop: "9,625 (below the gap)",
        targets: ["9,950", "10,100", "10,300 stretch"],
        invalidation: "USDIDR breaks 16,000 and BI does not intervene by close.",
        rationale:
          "Foreign net buy is concentrated here for a reason — positioning ahead of the BI decision. The BBCA-as-IDR-proxy trade. If the rupiah holds, BBCA leads the index higher; if it breaks, this is a stop-out, not an average-down.",
        confidence: 3,
        tags: ["mean-reversion", "developing-edge"],
      },
    ],
    risks: [
      "Hot US CPI tomorrow flips the entire script — equity short becomes consensus and gets squeezed first.",
      "BoJ surprise hold + dovish language = USDJPY shorts get cleaned out fast.",
      "Track CNH fix at 09:15 HKT before adding to HSI.",
      "USDIDR break of 16,000 invalidates BBCA — the trade is the rupiah cap, not the bank.",
    ],
  },
  {
    id: "TP-2604-B",
    date: "2026-04-04",
    horizon: "weekly",
    authoredBy: "Anthony",
    thesis:
      "Pre-NFP positioning. Dollar index held 104 for a week — that's a level that matters. Weak payroll print flushes the whole DXY long, which is the exit liquidity for Asia FX shorts. Don't predict the number, trade the reaction.",
    setups: [
      {
        id: "S-01",
        instrument: "DXY",
        direction: "short",
        bias: "bearish",
        entry: "104.75 — 104.90 on any spike pre-NFP",
        stop: "105.20",
        targets: ["104.20", "103.80"],
        invalidation: "NFP > 300K. At that point the dollar long is vindicated.",
        rationale:
          "DXY has been rangebound for 8 sessions — breakouts from that tight a range are usually head-fakes when driven by sentiment, not data.",
        confidence: 4,
        tags: ["risk-management", "trend-following"],
        outcome: "win",
        outcomeNotes: "Filled 104.82 pre-NFP. NFP printed 198K, DXY flushed to 104.05. Closed at T1 (104.20) for +1.8R.",
        outcomeR: "+1.8R",
      },
      {
        id: "S-02",
        instrument: "USDIDR",
        direction: "short",
        bias: "bearish",
        entry: "15,920 if DXY rolls over",
        stop: "15,985",
        targets: ["15,820", "15,760"],
        invalidation: "Any close back above 16,000. BI's line, not ours.",
        rationale:
          "Rupiah proxy trade. IDR has been the cleanest high-beta carry in Asia for 6 weeks. Flush the dollar, the carry comes back.",
        confidence: 3,
        tags: ["mean-reversion"],
        outcome: "win",
        outcomeNotes: "DXY rolled over on NFP, IDR carry back on. Closed at T1 (15,820) for +1.5R.",
        outcomeR: "+1.5R",
      },
    ],
    risks: [
      "NFP hot print (+300K or higher) reverses everything — exit immediately.",
      "BI intervention above 16,000 is possible and would cap the USDIDR move.",
    ],
  },
  {
    id: "TP-2604-C",
    date: "2026-04-01",
    horizon: "intraday",
    authoredBy: "Anthony",
    thesis:
      "Month-end rebalance flows. Equity outperformed bonds in March — sell-side pensions will be mechanically selling SPX into the 15:30 ET close for rebalancing. Fade the close, scalp the bounce.",
    setups: [
      {
        id: "S-01",
        instrument: "ES1!",
        direction: "long",
        bias: "bullish",
        entry: "Into the 15:45 ET flush, any dip to 5,180",
        stop: "5,165",
        targets: ["5,200", "5,220 if volume picks up"],
        invalidation: "No bounce by 15:55 ET — step aside, don't fight it.",
        rationale:
          "Mechanical flows create 15-minute windows of predictable liquidity. This isn't a thesis trade, it's a flow trade.",
        confidence: 3,
        tags: ["mean-reversion"],
        outcome: "stopped",
        outcomeNotes: "SPX was already down 1.2% on the day — rebalance was priced in. No bounce materialised. Stopped at 5,165 for -1R. Pre-commit rule on >1% days would have kept us out.",
        outcomeR: "-1R",
      },
    ],
    risks: [
      "Month-end rebalance flows are estimates, not facts. Size accordingly.",
      "If SPX is already down >1% on the day the rebalance is already priced in — skip the trade.",
    ],
  },
  {
    id: "TP-2603-D",
    date: "2026-03-28",
    horizon: "swing",
    authoredBy: "Anthony",
    thesis:
      "Quarter-end dollar funding squeeze. Every Q-end the dollar gets bid on repo pressure — cross-currency basis widens, USDJPY leads. The trade isn't the move, it's the fade when the pressure releases at 09:00 Tokyo on Apr 1.",
    setups: [
      {
        id: "S-01",
        instrument: "USDJPY",
        direction: "short",
        bias: "bearish",
        entry: "151.80+ on quarter-end bid",
        stop: "152.50",
        targets: ["150.80", "150.20"],
        invalidation: "No fade post-09:00 JST Apr 1 — trade is wrong.",
        rationale:
          "Mechanical funding pressure unwinds at the start of the new quarter. The first 4 hours of Tokyo on Apr 1 is the window.",
        confidence: 4,
        tags: ["mean-reversion", "developing-edge"],
        outcome: "win",
        outcomeNotes: "Filled at 151.92 on the quarter-end bid. Closed at T2 (150.20) for +2.4R. Cleanest fade of the quarter.",
        outcomeR: "+2.4R",
      },
      {
        id: "S-02",
        instrument: "GC1!",
        direction: "long",
        bias: "bullish",
        entry: "2,310 — 2,318 on the DXY high",
        stop: "2,298",
        targets: ["2,345", "2,365"],
        invalidation: "DXY accelerates higher, gold doesn't catch a bid.",
        rationale:
          "Gold has been tracking real yields, not DXY, for 3 weeks. At the quarter-end DXY spike, gold is the cleanest hedge.",
        confidence: 3,
        tags: ["trend-following"],
        outcome: "skipped",
        outcomeNotes: "DXY never spiked — conditions not met. No trade.",
      },
    ],
    risks: [
      "Quarter-end flows are approximate. Size 50% of normal.",
      "BoJ intervention risk near 152 — they've been live the last two sessions.",
    ],
  },
  {
    id: "TP-2603-E",
    date: "2026-03-24",
    horizon: "weekly",
    authoredBy: "Anthony",
    thesis:
      "Regional bank stress returning. KRE has been leading SPX lower for 3 sessions — credit spreads are widening but HY indices haven't caught up. The gap closes one way: HY gets repriced lower, fast.",
    setups: [
      {
        id: "S-01",
        instrument: "HYG",
        direction: "short",
        bias: "bearish",
        entry: "76.50 — 76.80",
        stop: "77.20",
        targets: ["75.80", "75.30"],
        invalidation: "KRE reclaims 48 on a daily close. Thesis broken.",
        rationale:
          "Credit always moves after equity in stress events. The divergence is the opportunity — 2-3 day window before it closes.",
        confidence: 3,
        tags: ["trend-following", "risk-management"],
        outcome: "invalidated",
        outcomeNotes: "KRE reclaimed 48 on a Fed liquidity headline the next session. Exited flat on invalidation rule. No damage done — the rule saved us.",
        outcomeR: "0R",
      },
    ],
    risks: [
      "If KRE bounces hard on no news, this is a bull trap for HY shorts.",
      "Fed lifeline headlines have killed this trade twice in 2024 — watch the wire.",
    ],
  },
];

export function computePlanOutcome(plan: TradingPlan) {
  const closed = plan.setups.filter(
    (s) => s.outcome && s.outcome !== "live" && s.outcome !== "open"
  );
  if (closed.length === 0) return null;

  const wins = closed.filter((s) => s.outcome === "win").length;
  const losses = closed.filter(
    (s) => s.outcome === "loss" || s.outcome === "stopped"
  ).length;
  const flat = closed.filter(
    (s) => s.outcome === "invalidated"
  ).length;
  const skipped = closed.filter((s) => s.outcome === "skipped").length;

  // Sum R by parsing outcomeR strings like "+1.8R", "-1R", "0R"
  const totalR = closed.reduce((acc, s) => {
    if (!s.outcomeR) return acc;
    const n = parseFloat(s.outcomeR.replace(/R/i, ""));
    return isFinite(n) ? acc + n : acc;
  }, 0);

  return {
    closed: closed.length,
    wins,
    losses,
    flat,
    skipped,
    totalR,
    totalRLabel: (totalR >= 0 ? "+" : "") + totalR.toFixed(1) + "R",
  };
}

export function getAllPlans(): TradingPlan[] {
  return [...tradingPlans].sort((a, b) => b.date.localeCompare(a.date));
}

export const subscriptionPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceIDR: 0,
    cadence: "3-month",
    features: [
      "Unfiltered news + impact analysis",
      "Economic calendar",
      "My Channel (founder broadcast)",
      "Public psychology primers",
      "Limited hashtag explorer",
    ],
  },
  {
    id: "vip-trader",
    name: "VIP+ Trader",
    priceIDR: 4_500_000,
    cadence: "3-month",
    highlight: true,
    features: [
      "Everything in Free",
      "Daily / weekly Trading Plan",
      "1v1 Consultation (AI + team)",
      "Full Education library",
      "Full Hashtag explorer",
      "Access to all collab channels",
    ],
  },
];
