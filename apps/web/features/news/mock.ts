import type { NewsItem } from "@/features/news/types";

// Note: every item is signed by a TradeVantage author. We never credit the original
// wire source. Refurbished news is presented as our own analysis. This is
// the entire point of the desk.

// `m` is minutes before the request, so the feed is always fresh in demo mode.
type Seed = Omit<NewsItem, "ts"> & { m: number };

const seeds: Seed[] = [
  {
    id: "N-0124",
    m: 7,
    author: "Desk",
    headline: "Gold slips under 3,900 as real yields push to the top of the month's range",
    impact: "high",
    bias: "bearish",
    affects: ["XAUUSD", "DXY", "US10Y"],
    analysis:
      "Third failed attempt to hold 3,920 since Thursday. US 10Y at 4.93% is the anchor: every basis point higher is a little more weight on the metal. The 3,879 low from the London session is the line. Lose it on a 1H close and the next shelf is 3,842.",
    tags: ["precious-metals", "interest-rates", "bonds"],
    relatedPlanIds: ["TP-0112"],
  },
  {
    id: "N-0123",
    m: 26,
    author: "Desk",
    headline: "Brent holds above 113 after weekend supply headlines, WTI tests 104.99 high",
    impact: "high",
    bias: "bullish",
    affects: ["WTI", "WTIUSD", "CL", "BZ", "CAD"],
    analysis:
      "The bid is in the front of the curve, which says physical tightness rather than speculative froth. WTI ran from 99.44 to 104.99 in five sessions. Chasing here is poor risk. The trade is a pullback into 102.60, not a breakout buy at the high.",
    tags: ["energy", "commodities", "geopolitics"],
  },
  {
    id: "N-0122",
    m: 48,
    author: "Anthony",
    headline: "USDJPY back above 157.50, MoF officials say they are watching moves 'with urgency'",
    impact: "high",
    bias: "bearish",
    affects: ["USDJPY", "JPY", "JGB"],
    analysis:
      "Verbal intervention is step one of three. The pattern from prior episodes: words, then rate checks, then action. 158.35 was last week's high and the obvious line. Longs above 158 are paying for the privilege of being the exit liquidity.",
    tags: ["forex", "central-banks", "volatility"],
    relatedPlanIds: ["TP-0112"],
  },
  {
    id: "N-0121",
    m: 71,
    author: "Desk",
    headline: "Nasdaq 100 futures extend slide, down 2.7% from last week's 29,848 high",
    impact: "medium",
    bias: "bearish",
    affects: ["NDX", "SPX"],
    analysis:
      "Rotation, not panic. Equal weight is holding up better than cap weight and the VIX term curve is still in contango. The level that matters is 28,093, last week's low. A daily close under it turns the pullback into a trend change.",
    tags: ["equities", "tech-sector", "risk-off"],
  },
  {
    id: "N-0120",
    m: 95,
    author: "Desk",
    headline: "Euro area manufacturing PMI final revised up to 49.6, still below the 50 line",
    impact: "medium",
    bias: "neutral",
    affects: ["EURUSD", "EUR", "DAX"],
    analysis:
      "Upward revision is a footnote. The number that moves EURUSD this week is the US payroll print on Friday. Until then the pair sits in a 1.1114 to 1.1230 box and the middle of the box is a coin flip.",
    tags: ["economic-data", "forex"],
  },
  {
    id: "N-0119",
    m: 132,
    author: "Anthony",
    headline: "Bitcoin loses 78k as perp funding turns negative across major venues",
    impact: "medium",
    bias: "bearish",
    affects: ["BTCUSD", "ETHUSD", "BTC", "ETH"],
    analysis:
      "Negative funding with spot still bid is a squeeze setup, not a top. Spot ETF flows were flat yesterday, not negative. Shorts are crowded under 77k. The 76,148 low is where they put their stops above, and where a flush would find buyers.",
    tags: ["crypto", "momentum", "liquidity"],
  },
  {
    id: "N-0118",
    m: 168,
    author: "Desk",
    headline: "RBA holds cash rate, statement keeps a hiking bias as services inflation sticks",
    impact: "high",
    bias: "bullish",
    affects: ["AUDUSD", "AUD"],
    analysis:
      "AUDUSD popped to 0.7069 on the release and gave half of it back within the hour. A hawkish hold is priced. To extend, the pair needs China data to cooperate. Watch 0.7013 as support into the Asia close.",
    tags: ["central-banks", "monetary-policy", "forex"],
  },
  {
    id: "N-0117",
    m: 215,
    author: "Anthony",
    headline: "China Caixin manufacturing PMI beats at 51.2, metals catch a small bid",
    impact: "medium",
    bias: "bullish",
    affects: ["AUDUSD", "HG1", "CNH"],
    analysis:
      "Good number, muted reaction. Copper moved, AUD barely did. When a beat cannot lift the high beta currency, positioning is already long. Fade strength in AUD rather than chase it.",
    tags: ["economic-data", "commodities"],
  },
  {
    id: "N-0116",
    m: 290,
    author: "Desk",
    headline: "Dollar index steady near 102 ahead of ISM, two-way flows into month start",
    impact: "low",
    bias: "neutral",
    affects: ["DXY", "EURUSD", "GBPUSD"],
    analysis:
      "DXY has held a 101.54 to 102.49 range for five sessions. Month-start rebalancing is noise. ISM prices paid is the component to watch: a hot print pushes yields and the dollar together.",
    tags: ["forex", "economic-data"],
  },
  {
    id: "N-0115",
    m: 380,
    author: "Anthony",
    headline: "BI keeps rupiah defence active as USDIDR trades near 18,140",
    impact: "high",
    bias: "bullish",
    affects: ["USDIDR", "JKSE", "INDOGB10Y"],
    analysis:
      "The level matters more than the rate. BI has been in the market at 18,180 twice in a week. If that cap breaks and BI does not step in by the next session, the implicit line is gone. That is the trade, not the policy statement.",
    tags: ["central-banks", "forex", "risk-off"],
    relatedPlanIds: ["TP-0111"],
  },
  {
    id: "N-0114",
    m: 470,
    author: "Anthony",
    headline: "JKSE extends losses toward 5,050, foreign outflows concentrated in big banks",
    impact: "medium",
    bias: "bearish",
    affects: ["JKSE", "BBCA", "BBRI", "BMRI"],
    analysis:
      "Down from 5,453 in five sessions. Foreign selling is concentrated in the big four banks, which tells you it is a currency trade wearing an equity costume. When USDIDR stabilises, this stops. Not before.",
    tags: ["equities", "risk-off", "liquidity"],
  },
  {
    id: "N-0113",
    m: 610,
    author: "Desk",
    headline: "Treasury refunding preview: dealers expect coupon sizes unchanged, bills to absorb the gap",
    impact: "medium",
    bias: "neutral",
    affects: ["US10Y", "ZN", "DXY"],
    analysis:
      "No surprise is the base case. The tail risk is a hint of larger coupons next quarter, which would push term premium higher and 10Y through 5%. That is the one scenario that hurts gold and the Nasdaq at the same time.",
    tags: ["bonds", "fiscal-policy", "us-politics"],
  },
  {
    id: "N-0112",
    m: 780,
    author: "Desk",
    headline: "Polymarket odds of a December Fed cut drift lower through the weekend",
    impact: "medium",
    bias: "bearish",
    affects: ["SPX", "ZN", "XAUUSD"],
    analysis:
      "Prediction markets repriced before the rates market did. The sequencing matters more than the level: when the crowd moves first, futures usually follow within a session.",
    tags: ["monetary-policy", "interest-rates"],
  },
  {
    id: "N-0111",
    m: 1010,
    author: "Anthony",
    headline: "ETH underperforms BTC for a sixth session, ratio at a three month low",
    impact: "low",
    bias: "bearish",
    affects: ["ETHUSD", "ETH", "BTC"],
    analysis:
      "ETH at 2,255 against a 2,389 high last week. Relative weakness in a falling market is information. If you want crypto beta on the long side, BTC is the cleaner vehicle until the ratio stops making new lows.",
    tags: ["crypto", "momentum"],
  },
  {
    id: "N-0110",
    m: 1290,
    author: "Desk",
    headline: "Weekend gap: gold opens lower in Asia, fills half the gap by the London open",
    impact: "medium",
    bias: "neutral",
    affects: ["XAUUSD", "XAGUSD"],
    analysis:
      "Half fills are the most common outcome for weekend gaps in metals. The other half is the decision point. Silver is weaker than gold, under 49.30, which says the selling is macro rather than a single flow.",
    tags: ["precious-metals", "safe-haven", "volatility"],
  },
  {
    id: "N-0109",
    m: 1620,
    author: "Anthony",
    headline: "Sterling holds 1.3390 as UK gilt yields ease from last week's highs",
    impact: "low",
    bias: "neutral",
    affects: ["GBPUSD", "GBP", "GILT10Y"],
    analysis:
      "Cable has done nothing for three days, which is information in itself. 1.3274 is the swing low and 1.3434 the swing high. The first clean break gets the next 80 pips. Until then, nobody needs to be in it.",
    tags: ["forex", "bonds"],
  },
  {
    id: "N-0108",
    m: 2050,
    author: "Desk",
    headline: "OPEC+ sources signal no change to December output plan",
    impact: "high",
    bias: "bullish",
    affects: ["WTI", "WTIUSD", "CL", "BZ", "XLE"],
    analysis:
      "No change is bullish when inventories are drawing. Energy equities have lagged crude by about two sessions. That lag is where the trade lives, not in front month crude at the highs.",
    tags: ["energy", "commodities", "geopolitics"],
  },
  {
    id: "N-0107",
    m: 2480,
    author: "Desk",
    headline: "US core PCE prints 0.3% month on month, in line, services ex housing firm",
    impact: "high",
    bias: "bearish",
    affects: ["SPX", "NDX", "DXY", "US10Y", "XAUUSD"],
    analysis:
      "In line on the headline, hot under the hood. Services ex housing is the part the Fed watches and it did not cool. Front end yields lifted 4bp on the detail, not the headline.",
    tags: ["inflation", "economic-data", "monetary-policy"],
    relatedPlanIds: ["TP-0110"],
  },
  {
    id: "N-0106",
    m: 2950,
    author: "Anthony",
    headline: "Month end rebalancing: pension models point to equity selling into the close",
    impact: "medium",
    bias: "bearish",
    affects: ["SPX", "NDX"],
    analysis:
      "Estimates, not facts. Equities outperformed bonds this month, so the mechanical flow is equity supply into the last hour. If the index is already down more than 1% on the day, the flow is priced. Skip it.",
    tags: ["equities", "liquidity"],
  },
  {
    id: "N-0105",
    m: 3420,
    author: "Desk",
    headline: "ECB holds rates, statement leaves the door open to a December move",
    impact: "high",
    bias: "bearish",
    affects: ["EURUSD", "EUR", "DAX", "EU2Y"],
    analysis:
      "Optionality, not a signal. The euro gave back 40 pips from 1.1230 into the press conference. The market wanted a commitment and did not get one. EURUSD is now a dollar story until payrolls.",
    tags: ["central-banks", "monetary-policy", "forex"],
  },
  {
    id: "N-0104",
    m: 3900,
    author: "Desk",
    headline: "Silver drops 9% from the week's high as leveraged longs unwind",
    impact: "medium",
    bias: "bearish",
    affects: ["XAGUSD", "XAUUSD"],
    analysis:
      "From 54.69 to under 49.30. Silver always overshoots gold in both directions. The gold to silver ratio back above 79 says this was positioning, not a change in the macro story.",
    tags: ["precious-metals", "volatility"],
  },
  {
    id: "N-0103",
    m: 4380,
    author: "Anthony",
    headline: "Chip stocks lead Nasdaq lower after a cautious guide from a large foundry",
    impact: "medium",
    bias: "bearish",
    affects: ["NDX", "SOX", "TSM"],
    analysis:
      "Capex cycle is intact, the guide was about timing. The trade is not in the foundry itself but in second derivative names that ran hardest. They give back the most when the leader blinks.",
    tags: ["tech-sector", "earnings", "equities"],
  },
  {
    id: "N-0102",
    m: 4700,
    author: "Desk",
    headline: "Stablecoin bill clears committee vote, crypto majors catch a two hour bid",
    impact: "medium",
    bias: "bullish",
    affects: ["BTC", "ETH", "BTCUSD", "ETHUSD"],
    analysis:
      "Regulatory clarity headlines have a half life of about a session. The bid faded before New York closed. Use these spikes to trim, not to add, while funding is this crowded.",
    tags: ["regulation", "crypto", "us-politics"],
  },
  {
    id: "N-0101",
    m: 5050,
    author: "Desk",
    headline: "Risk appetite returns into the Asia close as equity futures bounce off the lows",
    impact: "low",
    bias: "bullish",
    affects: ["SPX", "NDX", "AUDUSD", "USDJPY"],
    analysis:
      "Short covering, not new money. Volume on the bounce was a third of the selling volume. Treat it as a chance to reset shorts at better levels rather than a turn.",
    tags: ["risk-on", "equities", "momentum"],
  },
];

export function news(): NewsItem[] {
  const now = Date.now();
  return seeds.map(({ m, ...n }) => ({ ...n, ts: new Date(now - m * 60_000).toISOString() }));
}
