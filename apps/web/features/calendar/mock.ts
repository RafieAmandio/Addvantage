import type { CalendarEvent, CalendarDayMeta } from "@/lib/mock/types";

/**
 * Fixed currency order used by every `scores` tuple on a calendar event.
 * Matches the column layout of /app/calendar.
 */
export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

/**
 * Curated per-day headline summaries. If a date is not listed, the calendar
 * page derives a summary from the day's highest-impact events.
 */
export const calendarDayMeta: CalendarDayMeta[] = [
  { date: "2026-04-03", summary: "NFP + Unemployment" },
  { date: "2026-04-06", summary: "ISM Services PMI" },
  { date: "2026-04-07", summary: "Durable Goods Orders" },
  { date: "2026-04-08", summary: "BI Rate + US CPI + FOMC Minutes" },
  { date: "2026-04-09", summary: "Core PCE + GDP + Income/Spending" },
  { date: "2026-04-10", summary: "CPI + Michigan Sentiment" },
];

export const calendar: CalendarEvent[] = [
  // ─── FRIDAY APR 3 — NFP WEEK ───
  {
    id: "C-001",
    ts: "2026-04-03T12:30:00Z",
    region: "US",
    title: "Retail Sales MoM FEB",
    impact: "medium",
    scores: [6, 5, 5, 4, 3, 3, 4],
    forecast: "0.4%",
    previous: "0.6%",
  },
  {
    id: "C-002",
    ts: "2026-04-03T14:00:00Z",
    region: "US",
    title: "ISM Manufacturing PMI MAR",
    impact: "high",
    scores: [7, 6, 6, 5, 6, 5, 5],
    forecast: "50.8",
    previous: "50.3",
  },
  {
    id: "C-003",
    ts: "2026-04-03T12:30:00Z",
    region: "US",
    title: "Non Farm Payrolls MAR",
    impact: "high",
    scores: [9, 9, 9, 8, 6, 6, 7],
    forecast: "215K",
    previous: "275K",
    notes: "The single most important US number of the month. Everything else is footnote.",
  },
  {
    id: "C-004",
    ts: "2026-04-03T12:30:00Z",
    region: "US",
    title: "Unemployment Rate MAR",
    impact: "high",
    scores: [8, 7, 7, 7, 4, 4, 5],
    forecast: "3.9%",
    previous: "3.9%",
  },

  // ─── MONDAY APR 6 ───
  {
    id: "C-005",
    ts: "2026-04-06T14:00:00Z",
    region: "US",
    title: "ISM Services PMI MAR",
    impact: "high",
    scores: [7, 6, 6, 5, 5, 4, 5],
    forecast: "52.6",
    previous: "52.6",
    notes: "Services PMI is the tell on whether the Fed gets the inflation it wants.",
  },

  // ─── TUESDAY APR 7 ───
  {
    id: "C-006",
    ts: "2026-04-07T12:30:00Z",
    region: "US",
    title: "Durable Goods Orders MoM FEB",
    impact: "medium",
    scores: [5, 4, 4, 4, 4, 3, 3],
    forecast: "1.1%",
    previous: "1.4%",
  },

  // ─── WEDNESDAY APR 8 — BI DAY ───
  {
    id: "C-007",
    ts: "2026-04-08T07:00:00Z",
    region: "ID",
    title: "BI 7-Day Reverse Repo Rate",
    impact: "high",
    scores: [4, 3, 3, 5, 2, 2, 5],
    forecast: "6.00%",
    previous: "6.00%",
    notes: "Watch the press conference more than the rate. USDIDR 16,000 line is the real signal.",
    relatedNewsId: "N-2604-016",
  },
  {
    id: "C-008",
    ts: "2026-04-08T12:30:00Z",
    region: "US",
    title: "Inflation Rate MoM/YoY MAR",
    impact: "high",
    scores: [9, 8, 9, 8, 6, 7, 8],
    forecast: "0.3% / 3.2%",
    previous: "0.4% / 3.2%",
    notes: "Headline CPI. Core is tomorrow. Front-end yields will react first.",
  },
  {
    id: "C-009",
    ts: "2026-04-08T18:00:00Z",
    region: "US",
    title: "FOMC Minutes",
    impact: "high",
    scores: [8, 7, 8, 7, 5, 5, 7],
    forecast: "—",
    previous: "—",
    notes: "Look for dissent count and language around 'persistent' inflation.",
    relatedNewsId: "N-2604-014",
  },

  // ─── THURSDAY APR 9 ───
  {
    id: "C-010",
    ts: "2026-04-09T01:50:00Z",
    region: "JP",
    title: "BoJ Policy Rate Decision",
    impact: "high",
    scores: [5, 4, 4, 9, 4, 3, 5],
    forecast: "0.10%",
    previous: "0.10%",
    notes: "Statement language matters more than the level.",
  },
  {
    id: "C-011",
    ts: "2026-04-09T11:00:00Z",
    region: "EU",
    title: "ECB Main Refinancing Rate",
    impact: "high",
    scores: [6, 9, 7, 5, 6, 4, 5],
    forecast: "4.50%",
    previous: "4.50%",
  },
  {
    id: "C-012",
    ts: "2026-04-09T12:30:00Z",
    region: "US",
    title: "Core PCE Price Index MoM FEB",
    impact: "high",
    scores: [8, 7, 7, 6, 4, 5, 7],
    forecast: "0.3%",
    previous: "0.4%",
    notes: "The Fed's preferred inflation measure. Matters more than CPI to the FOMC.",
  },
  {
    id: "C-013",
    ts: "2026-04-09T12:30:00Z",
    region: "US",
    title: "GDP Growth Rate QoQ Final Q4",
    impact: "medium",
    scores: [6, 5, 5, 5, 4, 3, 4],
    forecast: "2.6%",
    previous: "2.6%",
  },
  {
    id: "C-014",
    ts: "2026-04-09T12:30:00Z",
    region: "US",
    title: "Personal Income MoM FEB",
    impact: "low",
    scores: [4, 3, 3, 3, 2, 2, 3],
    forecast: "0.4%",
    previous: "1.0%",
  },
  {
    id: "C-015",
    ts: "2026-04-09T12:30:00Z",
    region: "US",
    title: "Personal Spending MoM FEB",
    impact: "medium",
    scores: [5, 4, 4, 4, 3, 3, 4],
    forecast: "0.5%",
    previous: "0.8%",
  },

  // ─── FRIDAY APR 10 ───
  {
    id: "C-016",
    ts: "2026-04-10T12:30:00Z",
    region: "US",
    title: "Core Inflation Rate MoM/YoY MAR",
    impact: "high",
    scores: [9, 8, 9, 8, 6, 7, 8],
    forecast: "0.3% / 3.7%",
    previous: "0.4% / 3.8%",
    notes: "If core sticks above 3.5% YoY, the June cut is dead.",
  },
  {
    id: "C-017",
    ts: "2026-04-10T14:00:00Z",
    region: "US",
    title: "Michigan Consumer Sentiment APR Prel",
    impact: "medium",
    scores: [6, 5, 5, 5, 3, 3, 5],
    forecast: "79.0",
    previous: "79.4",
  },
  {
    id: "C-018",
    ts: "2026-04-10T02:30:00Z",
    region: "CN",
    title: "China CPI YoY",
    impact: "high",
    scores: [4, 4, 4, 6, 3, 4, 6],
    forecast: "0.4%",
    previous: "0.7%",
  },
];
