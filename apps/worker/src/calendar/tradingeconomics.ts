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

const COUNTRY_CODE: Record<string, string> = {
  "united states": "US", "euro area": "EU", "united kingdom": "UK",
  "japan": "JP", "china": "CN", "germany": "EU", "indonesia": "ID",
  "australia": "AU", "canada": "CA", "india": "IN",
};

// Currency index: USD=0, EUR=1, GBP=2, JPY=3, CHF=4, CAD=5, AUD=6
const CURRENCY_IDX = {
  USD: 0, EUR: 1, GBP: 2, JPY: 3, CHF: 4, CAD: 5, AUD: 6,
} as const;

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

function parseDateHeader(text: string): Date | null {
  const match = text.trim().match(/\w+\s+(\w+)\s+(\d{1,2})\s+(\d{4})/);
  if (!match) return null;
  const months: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
  };
  const month = months[match[1]!];
  if (month === undefined) return null;
  return new Date(Date.UTC(parseInt(match[3]!, 10), month, parseInt(match[2]!, 10)));
}

function parseEventTime(timeStr: string, baseDate: Date): Date | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  let hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const ampm = match[3]!.toUpperCase();

  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  return new Date(Date.UTC(
    baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(),
    hours, minutes,
  ));
}

function stableHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

function cleanValue(raw: string): string | null {
  const s = raw.replace(/\s+/g, " ").trim();
  return s || null;
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
  actual: string | null;
  previous: string | null;
  consensus: string | null;
  forecast: string | null;
}

function parseEvents(html: string): CalendarEvent[] {
  const $ = cheerio.load(html);
  const out: CalendarEvent[] = [];
  const seen = new Set<string>();

  let currentDate = new Date();

  $("thead.table-header, tr[data-event]").each((_, el) => {
    const $el = $(el);

    if (el.tagName === "thead") {
      const headerText = $el.find("th").first().text();
      const parsed = parseDateHeader(headerText);
      if (parsed) currentDate = parsed;
      return;
    }

    const event = $el.attr("data-event") ?? "";
    const country = $el.attr("data-country") ?? "";
    const category = $el.attr("data-category") ?? "";
    const url = $el.attr("data-url") ?? "";
    const id = $el.attr("data-id") ?? "";

    if (!event || !country) return;
    if (!FOCUS_COUNTRIES.has(country.toLowerCase())) return;

    const score = scoreEvent(event);
    const countryCode = COUNTRY_CODE[country.toLowerCase()] ?? country.slice(0, 2).toUpperCase();

    // Extract time from first td
    const tds = $el.find("> td");
    const time = tds.eq(0).text().trim();

    // Extract actual/previous/consensus/forecast
    const actual = cleanValue(tds.find("#actual").text());
    const previous = cleanValue(tds.find("#previous").text());
    const consensus = cleanValue(tds.find("#consensus").text());
    const forecast = cleanValue(tds.find("#forecast").text());

    const occurredAt = parseEventTime(time, currentDate) ?? currentDate;
    const scores = buildScores(countryCode, score.impact);

    const externalId = `te:${id || stableHash(event + country + occurredAt.toISOString())}`;
    if (seen.has(externalId)) return;
    seen.add(externalId);

    out.push({
      externalId,
      country: countryCode,
      event,
      time,
      category,
      url: url ? `${BASE}${url}` : CALENDAR_URL,
      impact: score.impact,
      affects: score.affects,
      scores,
      occurredAt,
      actual,
      previous,
      consensus,
      forecast,
    });
  });

  return out;
}

function weekStartDates(weeksBack: number, weeksForward: number): string[] {
  const now = new Date();
  const dates: string[] = [];
  for (let w = -weeksBack; w <= weeksForward; w++) {
    const d = new Date(now);
    d.setDate(d.getDate() + w * 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dates.push(`${yyyy}${mm}${dd}`);
  }
  return dates;
}

export async function syncTradingEconomicsCalendar(): Promise<number> {
  logger.info("te-calendar: fetching");

  // Fetch current week + 3 weeks forward to cover ~30 days
  const weeks = weekStartDates(0, 3);
  const allEvents: CalendarEvent[] = [];

  for (const day of weeks) {
    const url = day === weeks[0] ? CALENDAR_URL : `${CALENDAR_URL}?day=${day}`;
    try {
      const html = await fetchText(url, { accept: "text/html" });
      const events = parseEvents(html);
      allEvents.push(...events);
      logger.info({ day, count: events.length }, "te-calendar: parsed week");
    } catch (err) {
      logger.warn({ err: String(err), day }, "te-calendar: fetch failed for week");
    }
    // Polite delay between requests
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Dedupe across weeks (pages can overlap)
  const deduped = new Map<string, CalendarEvent>();
  for (const ev of allEvents) {
    deduped.set(ev.externalId, ev);
  }
  const events = [...deduped.values()];
  logger.info({ count: events.length }, "te-calendar: total unique events");

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
          actual: ev.actual,
          previous: ev.previous,
          consensus: ev.consensus,
          forecast: ev.forecast,
        },
      },
    });
    inserted++;
  }

  logger.info({ inserted, total: events.length }, "te-calendar: sync done");
  return inserted;
}
