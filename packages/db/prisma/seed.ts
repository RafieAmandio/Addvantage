import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...\n");

  // ─── Sources ──────────────────────────────────────────────────────
  const sources = [
    { code: "FRED", name: "FRED — Federal Reserve Economic Data", url: "https://fred.stlouisfed.org", adapter: "fred", pollMinutes: 60 },
    { code: "SC", name: "SlickCharts — S&P 500 Constituents", url: "https://www.slickcharts.com/sp500", adapter: "slickcharts", pollMinutes: 60 },
    { code: "SPDJI", name: "S&P Dow Jones Indices", url: "https://www.spglobal.com/spdji", adapter: "spdji", pollMinutes: 60 },
    { code: "YRD", name: "Yardeni Research", url: "https://www.yardeni.com", adapter: "yardeni", pollMinutes: 60 },
    { code: "RBC", name: "RBC Wealth Management — Insights", url: "https://www.rbcwealthmanagement.com/en-asia/insights", adapter: "rbc", pollMinutes: 60 },
    { code: "TRUMP", name: "Donald Trump (Truth Social)", url: "https://trumpstruth.org/feed", adapter: "truth-social", pollMinutes: 60 },
    { code: "FF", name: "ForexFactory Economic Calendar", url: "https://nfs.faireconomy.media/ff_calendar_thisweek.xml", adapter: "forexfactory", pollMinutes: 360 },
  ];

  for (const s of sources) {
    await prisma.source.upsert({
      where: { code: s.code },
      update: { name: s.name, url: s.url, adapter: s.adapter, pollMinutes: s.pollMinutes },
      create: s,
    });
  }
  console.log(`✓ Sources: ${sources.length} upserted`);

  // ─── Admin profile ────────────────────────────────────────────────
  // Uses a deterministic UUID so seed is idempotent.
  // In production, profiles are created by Supabase Auth triggers.
  // This gives you an admin account to work with in dev.
  const ADMIN_ID = "00000000-0000-0000-0000-000000000001";
  await prisma.profile.upsert({
    where: { id: ADMIN_ID },
    update: {},
    create: {
      id: ADMIN_ID,
      handle: "admin",
      email: "admin@tradevantage.local",
      tier: "vip",
      isAdmin: true,
      signedLiability: true,
      markets: ["us", "crypto"],
      tradingLength: "5+",
    },
  });
  console.log("✓ Admin profile created (id: 00000000-...-000001)");

  // ─── Demo user ────────────────────────────────────────────────────
  const USER_ID = "00000000-0000-0000-0000-000000000002";
  await prisma.profile.upsert({
    where: { id: USER_ID },
    update: {},
    create: {
      id: USER_ID,
      handle: "demo_trader",
      email: "demo@tradevantage.local",
      tier: "free",
      isAdmin: false,
      signedLiability: true,
      markets: ["us"],
      tradingLength: "1-3",
      yearlyGoal: "Learn to manage risk consistently",
    },
  });
  console.log("✓ Demo user profile created (id: 00000000-...-000002)");

  // ─── Sample news items ────────────────────────────────────────────
  const now = new Date();

  const newsItems = [
    {
      sourceCode: "FRED",
      contentHash: "seed-fred-001",
      headline: "Fed holds rates steady at 5.25–5.50%",
      rephrased: "The Federal Reserve maintained its benchmark interest rate, signaling patience amid mixed economic data.",
      analysis: "Rate hold was widely expected. Market focus shifts to September dot-plot projections. Bond yields dipped 3bps on the announcement. Dollar weakened slightly vs majors.",
      impact: "high",
      bias: "neutral",
      affects: ["SPY", "TLT", "DXY"],
      tags: ["risk-management", "mean-reversion"],
      author: "FRED",
      status: "approved",
      reviewedBy: ADMIN_ID,
      reviewedAt: now,
      publishedAt: now,
    },
    {
      sourceCode: "SC",
      contentHash: "seed-sc-001",
      headline: "NVDA surpasses AAPL as largest S&P 500 constituent",
      rephrased: "NVIDIA overtook Apple by market-cap weight in the S&P 500 index, reflecting the AI hardware demand cycle.",
      analysis: "Rebalance implications for passive funds. ~$8B in index-tracking flows expected over the next rebalance window. Momentum traders watching for mean-reversion setup at prior ATH.",
      impact: "medium",
      bias: "bullish",
      affects: ["NVDA", "AAPL", "SPY", "QQQ"],
      tags: ["trend-following"],
      author: "SC",
      status: "approved",
      reviewedBy: ADMIN_ID,
      reviewedAt: now,
      publishedAt: now,
    },
    {
      sourceCode: "YRD",
      contentHash: "seed-yrd-001",
      headline: "Earnings revisions breadth turns positive for first time in 6 months",
      rephrased: "More S&P 500 companies are seeing upward earnings revisions than downward for the first time since late 2024.",
      analysis: "Historically a leading indicator for sustained rallies. Prior instances led to 8-12% gains over 6 months. Sector breadth still narrow — tech and healthcare dominating upgrades.",
      impact: "medium",
      bias: "bullish",
      affects: ["SPY", "XLK", "XLV"],
      tags: ["developing-edge"],
      author: "YRD",
      status: "pending",
    },
  ];

  for (const item of newsItems) {
    const existing = await prisma.newsItem.findFirst({
      where: { sourceCode: item.sourceCode, contentHash: item.contentHash },
    });
    if (!existing) {
      await prisma.newsItem.create({ data: item });
    }
  }
  console.log(`✓ News items: ${newsItems.length} seeded (2 approved, 1 pending)`);

  // ─── Sample trading plan ──────────────────────────────────────────
  const planExists = await prisma.tradingPlan.findFirst({ where: { symbol: "NVDA", authorId: ADMIN_ID } });
  if (!planExists) {
    await prisma.tradingPlan.create({
      data: {
        symbol: "NVDA",
        thesis: "AI capex cycle continues. Blackwell ramp drives beat-and-raise through Q3. Targeting breakout above prior ATH with pullback entry at 20-day EMA.",
        direction: "long",
        entry: 125.50,
        stop: 118.00,
        target: 152.00,
        rMultiple: 3.53,
        setups: [
          { label: "Pullback to 20 EMA", trigger: "Price touches 20 EMA on 1D", invalidation: "Close below 118" },
          { label: "Volume confirmation", trigger: "Above-average volume on bounce day" },
        ],
        tags: ["trend-following"],
        tier: "free",
        status: "published",
        authorId: ADMIN_ID,
        publishedAt: now,
      },
    });
  }
  console.log("✓ Sample trading plan created (NVDA long)");

  // ─── Sample education primer ──────────────────────────────────────
  await prisma.educationPrimer.upsert({
    where: { slug: "risk-management-101" },
    update: {},
    create: {
      slug: "risk-management-101",
      title: "Risk Management 101: Position Sizing & the 1% Rule",
      author: "Anthony",
      framework: "Risk-First",
      summary: "Why most traders blow up — and the one rule that prevents it.",
      body: [
        "## Why position sizing matters\n\nMost retail traders lose not because their entries are bad, but because a single loss wipes out weeks of gains. The fix is mechanical: never risk more than 1% of your account on a single trade.",
        "## The 1% rule in practice\n\nIf your account is $10,000, your max risk per trade is $100. With a $2 stop-loss distance, you can buy 50 shares. This is non-negotiable — no conviction, no tip, no FOMO overrides it.",
        "## R-multiples\n\nExpress every trade outcome as a multiple of your risk (R). A trade where you risked $100 and made $300 is a +3R. A loss at your stop is -1R. Track your average R across 50+ trades to know if your edge is real.",
      ],
      tags: ["risk-management", "loss-aversion"],
      readingMin: 5,
      locked: false,
      published: true,
      sortOrder: 1,
    },
  });

  await prisma.educationPrimer.upsert({
    where: { slug: "mean-reversion-setups" },
    update: {},
    create: {
      slug: "mean-reversion-setups",
      title: "Mean Reversion Setups: Trading the Snap-Back",
      author: "Anthony",
      framework: "Statistical",
      summary: "How to identify overstretched moves and trade the return to the mean.",
      body: [
        "## What is mean reversion?\n\nPrices oscillate around a moving average. When they stretch too far, they tend to snap back. Mean reversion strategies exploit this tendency.",
        "## Key indicators\n\nBollinger Band width, RSI extremes (below 30 or above 70), and distance from VWAP. The best setups combine 2+ of these signals.",
        "## Entry and risk\n\nEnter on the first sign of reversal (a hammer candle, a divergence), not during the move. Stop goes beyond the extreme. Target is the mean itself — don't get greedy.",
      ],
      tags: ["mean-reversion", "developing-edge"],
      readingMin: 4,
      locked: false,
      published: true,
      sortOrder: 2,
    },
  });
  console.log("✓ Education primers: 2 seeded");

  // ─── Sample timeline events ───────────────────────────────────────
  const feedItems = await prisma.newsItem.findMany({
    where: { status: "approved" },
    select: { id: true, sourceCode: true, headline: true, publishedAt: true, affects: true, bias: true, impact: true },
    take: 2,
  });

  for (const item of feedItems) {
    const exists = await prisma.timelineEvent.findFirst({ where: { newsItemId: item.id } });
    if (!exists) {
      await prisma.timelineEvent.create({
        data: {
          kind: "news",
          sourceCode: item.sourceCode,
          occurredAt: item.publishedAt ?? now,
          symbols: item.affects,
          title: item.headline,
          bias: item.bias,
          impact: item.impact,
          newsItemId: item.id,
        },
      });
    }
  }
  console.log(`✓ Timeline events: ${feedItems.length} created from approved news`);

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
