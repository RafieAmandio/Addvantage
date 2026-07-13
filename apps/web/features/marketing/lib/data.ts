export const FUTURA = "'Futura', 'Inter', system-ui, sans-serif";

export const heroTicker = [
  { sym: "EURUSD", val: "1.0847", chg: "+0.31%", dir: "up" as const },
  { sym: "BTCUSD", val: "68,240", chg: "+2.14%", dir: "up" as const },
  { sym: "GBPUSD", val: "1.2718", chg: "-0.42%", dir: "down" as const },
  { sym: "XAUUSD", val: "2,381.40", chg: "+0.83%", dir: "up" as const },
  { sym: "USDJPY", val: "157.22", chg: "+0.48%", dir: "up" as const },
  { sym: "ETHUSD", val: "3,542", chg: "-1.27%", dir: "down" as const },
  { sym: "SOLUSD", val: "168.90", chg: "+4.61%", dir: "up" as const },
  { sym: "AUDUSD", val: "0.6648", chg: "-0.19%", dir: "down" as const },
];

export const pillars = [
  {
    code: "TX-01",
    title: "Unfiltered News + Impact",
    desc: "Raw market-moving news in real time. Each item annotated with what it actually means for price.",
    locked: false,
  },
  {
    code: "TX-02",
    title: "Economic Calendar",
    desc: "Curated calendar of high-impact events, central bank decisions, earnings, macro releases.",
    locked: false,
  },
  {
    code: "TX-03",
    title: "Trading Plan",
    desc: "Daily / weekly directional plan. Setups, levels, invalidation. Authored, not signaled.",
    locked: true,
  },
  {
    code: "TX-04",
    title: "1v1 Consultation",
    desc: "Private chat with the AI and the desk. Trade reviews, second opinions, blind-spot checks.",
    locked: true,
  },
  {
    code: "TX-05",
    title: "Education",
    desc: "Process, psychology, risk, system design. No price-action snake oil.",
    locked: false,
  },
  {
    code: "TX-06",
    title: "My Channel",
    desc: "Founder broadcast. Daily takes. Continuous market context. No filter, no replies.",
    locked: false,
  },
];

export const faq = [
  {
    q: "Noise Reduction",
    a: "No herd mentality. No group-think distorting your read on the market. The minute a community forms, the average opinion becomes your opinion. We refuse to do that to you.",
  },
  {
    q: "No Paid Moderators",
    a: "AI moderation is still imperfect, and we refuse to charge users for a chat we cannot reliably regulate. If we can't do it well, we won't do it at all.",
  },
  {
    q: "Emotional Contagion",
    a: "Other people's panic and euphoria are the single biggest leak in most traders' P&L. We will not pipe that into your screen.",
  },
  {
    q: "Privacy & IP",
    a: "Trade discussions belong in closed 1v1 consultation, not in a public room where your edge becomes everyone's edge.",
  },
];
