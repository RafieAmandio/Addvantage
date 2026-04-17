export type NotificationKind = "alert" | "plan" | "consult" | "education" | "system";

export interface MockNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  ts: string;       // ISO timestamp
  href: string;     // where to navigate on click
}

/**
 * Hardcoded operator notifications. In a real product these would arrive over
 * SSE / websockets. Ordered newest-first.
 */
export const notifications: MockNotification[] = [
  {
    id: "NTF-021",
    kind: "alert",
    title: "FOMC Minutes drop in 40 minutes",
    body: "The trade is the dissent count. If 3+ members dissented, dot plot moves at the next meeting.",
    ts: "2026-04-08T17:20:00Z",
    href: "/app/news/N-2604-014",
  },
  {
    id: "NTF-020",
    kind: "plan",
    title: "BBCA setup hit T1 target",
    body: "S-04 BBCA long entry filled at 9,790. T1 9,950 reached. Stop moved to break-even.",
    ts: "2026-04-08T13:05:00Z",
    href: "/app/plan",
  },
  {
    id: "NTF-019",
    kind: "consult",
    title: "Anthony replied in CS-014",
    body: "Read primer #P-001 (Loss Aversion). The 'coward' framing is loss aversion in disguise.",
    ts: "2026-04-08T10:24:00Z",
    href: "/app/consult",
  },
  {
    id: "NTF-018",
    kind: "education",
    title: "New primer published",
    body: "P-006 IDX Foreign Flow as a Signal — 5 min read, locked behind VIP+.",
    ts: "2026-04-08T08:00:00Z",
    href: "/app/education/P-006",
  },
  {
    id: "NTF-017",
    kind: "alert",
    title: "BI 7DRR decision in 2 hours",
    body: "USDIDR 16,000 line is the real signal. Watch the press conference more than the rate.",
    ts: "2026-04-08T05:00:00Z",
    href: "/app/calendar?view=day&d=2026-04-08",
  },
  {
    id: "NTF-016",
    kind: "system",
    title: "Subscription renews in 89 days",
    body: "VIP+ Trader · Q3 renewal scheduled. No action required — billing will run automatically.",
    ts: "2026-04-07T08:00:00Z",
    href: "/app/subscription",
  },
  {
    id: "NTF-015",
    kind: "plan",
    title: "Trading Plan TP-2604-A published",
    body: "Macro repricing the cut path. Four setups live: ES1! short, USDJPY short, HSI long, BBCA long.",
    ts: "2026-04-07T07:30:00Z",
    href: "/app/plan",
  },
];
