import { prisma } from "@tradevantage/db";
import { fetchText } from "../lib/http";
import { logger } from "../lib/logger";
import type { Impact } from "@tradevantage/shared";

/**
 * Economic calendar from the ForexFactory weekly JSON feed (free, no key). TradingEconomics stopped
 * serving its table as HTML in 2026, which left the old scraper with zero rows every run.
 * The feed has no "actual" column, so released numbers aren't shown.
 */
const FEEDS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://nfs.faireconomy.media/ff_calendar_nextweek.json", // only published some days, 404 otherwise
];
const SOURCE_URL = "https://www.forexfactory.com/calendar";

// FF tags events by currency; the timeline stores a country code (web maps it back to the currency).
const CURRENCY_COUNTRY: Record<string, string> = {
  USD: "US", EUR: "EU", GBP: "UK", JPY: "JP", CNY: "CN", AUD: "AU", CAD: "CA", CHF: "CH", NZD: "NZ",
};

// Currency index: USD=0, EUR=1, GBP=2, JPY=3, CHF=4, CAD=5, AUD=6
const CURRENCY_IDX = {
  USD: 0, EUR: 1, GBP: 2, JPY: 3, CHF: 4, CAD: 5, AUD: 6,
} as const;

const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD", EU: "EUR", UK: "GBP", JP: "JPY",
  CN: "USD", ID: "USD", AU: "AUD", CA: "CAD", IN: "USD", CH: "CHF",
};

const IMPACT_MAP: Record<string, { impact: Impact; affects: string[] }> = {
  "interest rate decision":     { impact: "high", affects: ["SPX", "DXY", "US10Y", "GOLD"] },
  "fed interest rate decision": { impact: "high", affects: ["SPX", "DXY", "US10Y", "GOLD", "BTC"] },
  "non farm payrolls":          { impact: "high", affects: ["SPX", "DXY", "US10Y", "GOLD"] },
  "nonfarm payrolls":           { impact: "high", affects: ["SPX", "DXY", "US10Y", "GOLD"] },
  "cpi":                        { impact: "high", affects: ["SPX", "DXY", "US10Y", "GOLD"] },
  "inflation rate yoy":         { impact: "high", affects: ["SPX", "DXY", "US10Y"] },
  "inflation rate mom":         { impact: "high", affects: ["SPX", "DXY", "US10Y"] },
  "core inflation rate yoy":    { impact: "high", affects: ["SPX", "DXY", "US10Y"] },
  "gdp growth rate":            { impact: "high", affects: ["SPX", "DXY"] },
  "gdp growth rate qoq":        { impact: "high", affects: ["SPX", "DXY"] },
  "gdp annual growth rate":     { impact: "high", affects: ["SPX", "DXY"] },
  "gdp growth rate yoy":        { impact: "high", affects: ["SPX", "DXY"] },
  "unemployment rate":          { impact: "high", affects: ["SPX", "DXY"] },
  "pce price index":            { impact: "high", affects: ["SPX", "DXY", "US10Y"] },
  "core pce price index":       { impact: "high", affects: ["SPX", "DXY", "US10Y"] },
  "fomc":                       { impact: "high", affects: ["SPX", "DXY", "US10Y", "GOLD", "BTC"] },
  "ecb interest rate decision": { impact: "high", affects: ["EURUSD", "DAX"] },
  "boj interest rate decision": { impact: "high", affects: ["USDJPY", "NI225"] },
  "rba interest rate decision": { impact: "high", affects: ["AUDUSD"] },
  "adp employment change":      { impact: "medium", affects: ["SPX", "DXY"] },
  "jolts job openings":         { impact: "medium", affects: ["SPX", "DXY"] },
  "retail sales mom":           { impact: "medium", affects: ["SPX", "DXY"] },
  "retail sales yoy":           { impact: "medium", affects: ["SPX"] },
  "pmi":                        { impact: "medium", affects: ["SPX", "DXY"] },
  "manufacturing pmi":          { impact: "medium", affects: ["SPX", "DXY"] },
  "services pmi":               { impact: "medium", affects: ["SPX", "DXY"] },
  "composite pmi":              { impact: "medium", affects: ["SPX", "DXY"] },
  "consumer confidence":        { impact: "medium", affects: ["SPX"] },
  "ism manufacturing":          { impact: "medium", affects: ["SPX", "DXY"] },
  "ism services":               { impact: "medium", affects: ["SPX"] },
  "industrial production":      { impact: "medium", affects: ["SPX"] },
  "trade balance":              { impact: "medium", affects: ["DXY"] },
  "balance of trade":           { impact: "medium", affects: ["DXY"] },
  "initial jobless claims":     { impact: "medium", affects: ["SPX", "DXY"] },
  "continuing jobless claims":  { impact: "medium", affects: ["SPX", "DXY"] },
  "durable goods orders":       { impact: "medium", affects: ["SPX"] },
  "crude oil inventories":      { impact: "medium", affects: ["CL", "XLE"] },
  "michigan consumer sentiment":{ impact: "medium", affects: ["SPX"] },
  "building permits":           { impact: "medium", affects: ["SPX"] },
  "housing starts":             { impact: "medium", affects: ["SPX"] },
  "existing home sales":        { impact: "medium", affects: ["SPX"] },
  "new home sales":             { impact: "medium", affects: ["SPX"] },
  "personal spending":          { impact: "medium", affects: ["SPX"] },
  "personal income":            { impact: "medium", affects: ["SPX"] },
  "current account":            { impact: "medium", affects: ["DXY"] },
  "bi rate":                    { impact: "high", affects: ["USDIDR", "IHSG"] },
};

function scoreEvent(event: string): { impact: Impact; affects: string[] } {
  const eLower = event.toLowerCase();
  for (const [key, val] of Object.entries(IMPACT_MAP)) {
    if (eLower.includes(key)) return val;
  }
  if (eLower.includes("gdp")) return { impact: "medium", affects: ["SPX"] };
  if (eLower.includes("inflation")) return { impact: "medium", affects: ["DXY"] };
  if (eLower.includes("interest rate")) return { impact: "high", affects: ["DXY"] };
  if (eLower.includes("employment") || eLower.includes("payroll"))
    return { impact: "medium", affects: ["SPX", "DXY"] };
  // Default: include everything with low impact
  return { impact: "low", affects: [] };
}

function buildScores(countryCode: string, impact: Impact): number[] {
  const scores = [0, 0, 0, 0, 0, 0, 0];
  const currency = COUNTRY_CURRENCY[countryCode];
  if (!currency) return scores;

  const idx = CURRENCY_IDX[currency as keyof typeof CURRENCY_IDX];
  if (idx === undefined) return scores;

  const weight = impact === "high" ? 3 : impact === "medium" ? 2 : 1;
  scores[idx] = weight;

  if (impact === "high") {
    if (currency === "USD") {
      scores[CURRENCY_IDX.EUR] = -1;
      scores[CURRENCY_IDX.JPY] = -1;
      scores[CURRENCY_IDX.GBP] = -1;
    } else if (currency === "EUR") {
      scores[CURRENCY_IDX.USD] = -1;
    } else if (currency === "GBP") {
      scores[CURRENCY_IDX.EUR] = -1;
    }
  }

  return scores;
}

function stableHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

interface FfEvent {
  title: string;
  country: string; // currency, e.g. USD
  date: string; // ISO with offset
  impact: string; // High | Medium | Low | Holiday
  forecast?: string;
  previous?: string;
}

const FF_IMPACT: Record<string, Impact> = { high: "high", medium: "medium", low: "low" };

export async function syncCalendar(): Promise<number> {
  const raw: FfEvent[] = [];
  for (const url of FEEDS) {
    try {
      raw.push(...(JSON.parse(await fetchText(url, { accept: "application/json" })) as FfEvent[]));
    } catch (err) {
      logger.warn({ err: String(err), url }, "calendar: feed fetch failed");
    }
  }

  const events = raw.flatMap((e) => {
    const country = CURRENCY_COUNTRY[e.country?.toUpperCase()];
    const occurredAt = new Date(e.date);
    if (!country || !e.title || Number.isNaN(occurredAt.getTime())) return [];
    const scored = scoreEvent(e.title);
    const impact = FF_IMPACT[e.impact?.toLowerCase()] ?? "low";
    return [{ ...e, country, occurredAt, impact, affects: scored.affects, externalId: `ff:${stableHash(`${e.title}|${e.country}|${e.date}`)}` }];
  });

  // A failed or empty fetch must never blank the calendar: replace only the window just fetched.
  if (events.length === 0) {
    logger.warn("calendar: no events fetched, keeping what is stored");
    return 0;
  }
  const times = events.map((e) => e.occurredAt.getTime());
  const from = new Date(Math.min(...times));
  const to = new Date(Math.max(...times));

  await prisma.$transaction([
    prisma.timelineEvent.deleteMany({ where: { kind: "macro", sourceCode: { in: ["TE", "FF"] }, occurredAt: { gte: from, lte: to } } }),
    prisma.timelineEvent.createMany({
      data: events.map((ev) => ({
        kind: "macro" as const,
        sourceCode: "FF",
        occurredAt: ev.occurredAt,
        symbols: [ev.country],
        title: `${ev.country} — ${ev.title}`,
        body: `Impact: ${ev.impact} | Forecast: ${ev.forecast || "n/a"} | Previous: ${ev.previous || "n/a"}`,
        url: SOURCE_URL,
        impact: ev.impact,
        bias: null,
        metadata: {
          country: ev.country,
          externalId: ev.externalId,
          scores: buildScores(ev.country, ev.impact),
          region: ev.country,
          affects: ev.affects,
          previous: ev.previous || null,
          forecast: ev.forecast || null,
        },
      })),
    }),
  ]);

  logger.info({ inserted: events.length, from, to }, "calendar: sync done");
  return events.length;
}
