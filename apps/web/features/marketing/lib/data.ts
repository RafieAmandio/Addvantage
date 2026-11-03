export const FUTURA = "'Futura', 'Inter', system-ui, sans-serif";

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

export type WireItem = { t: string; at: string; tag: null | { impact: "HIGH" | "MED"; moves: [string, "up" | "down"][] } };

// A sample wire. Headlines are illustrative, not reports of real events.
export const WIRE: WireItem[] = [
  { at: "07:02", t: "Central bank chair repeats policy will stay data dependent", tag: null },
  { at: "07:15", t: "US inflation prints above forecast for a second month", tag: { impact: "HIGH", moves: [["USD", "up"], ["XAU", "down"]] } },
  { at: "07:21", t: "Bank raises its year-end gold target, again", tag: null },
  { at: "07:40", t: "Japan's finance ministry confirms it intervened for the yen", tag: { impact: "HIGH", moves: [["JPY", "up"]] } },
  { at: "07:52", t: "Famous investor says this rally feels like the top", tag: null },
  { at: "08:05", t: "UK payrolls miss, unemployment ticks up", tag: { impact: "MED", moves: [["GBP", "down"]] } },
  { at: "08:11", t: "Ten stocks to buy before the year ends", tag: null },
  { at: "08:30", t: "Oil producers agree a surprise output cut", tag: { impact: "HIGH", moves: [["WTI", "up"]] } },
];
