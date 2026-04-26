export const FUTURA = "'Futura', 'Inter', system-ui, sans-serif";

export const heroTicker = [
  { sym: "BBNI", val: "4.320", chg: "-4.2%", dir: "down" as const },
  { sym: "BBCA", val: "6.500", chg: "-4.2%", dir: "down" as const },
  { sym: "BBRI", val: "3.110", chg: "-1.2%", dir: "down" as const },
  { sym: "WBSA", val: "456", chg: "-24.2%", dir: "up" as const },
  { sym: "TPIA", val: "2.123", chg: "-1.2%", dir: "down" as const },
  { sym: "DGWA", val: "806", chg: "-0.1%", dir: "down" as const },
];

type HeroTickerItem = (typeof heroTicker)[number];

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
