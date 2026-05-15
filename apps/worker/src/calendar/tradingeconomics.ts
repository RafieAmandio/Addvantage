import * as cheerio from "cheerio";
import { prisma } from "@tradevantage/db";
import { fetchText } from "../lib/http";
import { logger } from "../lib/logger";
import type { Impact } from "@tradevantage/shared";

const BASE = "https://tradingeconomics.com";
const CALENDAR_URL = `${BASE}/calendar`;

const FOCUS_COUNTRIES = new Set([
  "united states", "euro area", "united kingdom", "japan", "china",
  "germany", "indonesia", "australia", "canada", "india",
]);

// Map country → 2-letter code for display + region
const COUNTRY_CODE: Record<string, string> = {
  "united states": "US", "euro area": "EU", "united kingdom": "UK",
  "japan": "JP", "china": "CN", "germany": "EU", "indonesia": "ID",
  "australia": "AU", "canada": "CA", "india": "IN",
};

// Currency index: USD=0, EUR=1, GBP=2, JPY=3, CHF=4, CAD=5, AUD=6
const CURRENCY_IDX: Record<string, number> = {
  USD: 0, EUR: 1, GBP: 2, JPY: 3, CHF: 4, CAD: 5, AUD: 6,
};

// Country → which currency it primarily affects
const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD", EU: "EUR", UK: "GBP", JP: "JPY",
  CN: "USD", ID: "USD", AU: "AUD", CA: "CAD", IN: "USD",
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
  "initial jobless claims":     { impact: "medium", affects: ["SPX", "DXY"] },
  "durable goods orders":       { impact: "medium", affects: ["SPX"] },
  "crude oil inventories":      { impact: "medium", affects: ["CL", "XLE"] },
  "bi rate":                    { impact: "high", affects: ["USDIDR", "IHSG"] },
};

function scoreEvent(event: string): { impact: Impact; affects: string[] } | null {
  const eLower = event.toLowerCase();
  for (const [key, val] of Object.entries(IMPACT_MAP)) {
    if (eLower.includes(key)) return val;
  }
  if (eLower.includes("gdp")) return { impact: "medium", affects: ["SPX"] };
  if (eLower.includes("inflation")) return { impact: "medium", affects: ["DXY"] };
  if (eLower.includes("interest rate")) return { impact: "high", affects: ["DXY"] };
  if (eLower.includes("employment") || eLower.includes("payroll")) return { impact: "medium", affects: ["SPX", "DXY"] };
  return null;
}

// Build currency impact scores: [USD, EUR, GBP, JPY, CHF, CAD, AUD]
function buildScores(countryCode: string, impact: Impact): number[] {
  const scores = [0, 0, 0, 0, 0, 0, 0];
  const currency = COUNTRY_CURRENCY[countryCode];
  if (!currency) return scores;

  const idx = CURRENCY_IDX[currency];
  if (idx === undefined) return scores;

  const weight = impact === "high" ? 3 : impact === "medium" ? 2 : 1;
  scores[idx] = weight;

  // Cross-currency effects for major events
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

// Parse "04:00 AM" or "01:30 PM" into a Date for today
function parseEventTime(timeStr: string): Date | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();

  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes));
  return d;
}

function stableHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

interface CalendarEvent {
  externalId: string;
  country: string;
  event: string;
  time: string;
  category: string;
  url: string;
  impact: Impact;
  affects: string[];
  scores: number[];
  occurredAt: Date;
}

function parseEvents(html: string): CalendarEvent[] {
  const $ = cheerio.load(html);
  const out: CalendarEvent[] = [];

  $("tr[data-event]").each((_, el) => {
    const $row = $(el);
    const event = $row.attr("data-event") ?? "";
    const country = $row.attr("data-country") ?? "";
    const category = $row.attr("data-category") ?? "";
    const url = $row.attr("data-url") ?? "";
    const id = $row.attr("data-id") ?? "";

    if (!event || !country) return;
    if (!FOCUS_COUNTRIES.has(country.toLowerCase())) return;

    const score = scoreEvent(event);
    if (!score) return;

    const tds = $row.find("td").map((_, td) => $(td).text().trim()).get();
    const time = tds[0] ?? "";
    const countryCode = COUNTRY_CODE[country.toLowerCase()] ?? country.slice(0, 2).toUpperCase();
    const occurredAt = parseEventTime(time) ?? new Date();
    const scores = buildScores(countryCode, score.impact);

    out.push({
      externalId: `te:${id || stableHash(event + country + time)}`,
      country: countryCode,
      event,
      time,
      category,
      url: url ? `${BASE}${url}` : CALENDAR_URL,
      impact: score.impact,
      affects: score.affects,
      scores,
      occurredAt,
    });
  });

  return out;
}

export async function syncTradingEconomicsCalendar(): Promise<number> {
  logger.info("te-calendar: fetching");

  let html: string;
  try {
    html = await fetchText(CALENDAR_URL, { accept: "text/html" });
  } catch (err) {
    logger.warn({ err: String(err) }, "te-calendar: fetch failed");
    return 0;
  }

  const events = parseEvents(html);
  logger.info({ count: events.length }, "te-calendar: parsed events");

  // Clear old TE events and re-insert fresh
  await prisma.timelineEvent.deleteMany({ where: { sourceCode: "TE", kind: "macro" } });

  let inserted = 0;
  for (const ev of events) {
    await prisma.timelineEvent.create({
      data: {
        kind: "macro",
        sourceCode: "TE",
        occurredAt: ev.occurredAt,
        symbols: [ev.country],
        title: `${ev.country} — ${ev.event}`,
        body: `Scheduled: ${ev.time || "TBD"} | Category: ${ev.category}`,
        url: ev.url,
        impact: ev.impact,
        bias: null,
        metadata: {
          country: ev.country,
          time: ev.time,
          externalId: ev.externalId,
          scores: ev.scores,
          region: ev.country,
        },
      },
    });
    inserted++;
  }

  logger.info({ inserted, total: events.length }, "te-calendar: sync done");
  return inserted;
}
