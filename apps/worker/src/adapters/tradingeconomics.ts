import * as cheerio from "cheerio";
import { fetchText } from "../lib/http";
import type { Impact } from "@tradevantage/shared";
import {
  dedupeByExternalId,
  type AdapterContext,
  type Candidate,
  type SourceAdapter,
} from "./base";

const BASE = "https://tradingeconomics.com";
const CALENDAR_URL = `${BASE}/calendar`;

// Countries we care about for market impact
const FOCUS_COUNTRIES = new Set([
  "united states", "euro area", "united kingdom", "japan", "china",
  "germany", "indonesia", "australia", "canada", "india",
]);

// Our own scoring: event category → impact + affected instruments
const IMPACT_MAP: Record<string, { impact: Impact; affects: string[] }> = {
  // Tier 1: Market-moving — these move everything
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
  "unemployment rate":          { impact: "high", affects: ["SPX", "DXY"] },
  "pce price index":            { impact: "high", affects: ["SPX", "DXY", "US10Y"] },
  "core pce price index":       { impact: "high", affects: ["SPX", "DXY", "US10Y"] },
  "fomc":                       { impact: "high", affects: ["SPX", "DXY", "US10Y", "GOLD", "BTC"] },
  "ecb interest rate decision": { impact: "high", affects: ["EURUSD", "DAX"] },
  "boj interest rate decision": { impact: "high", affects: ["USDJPY", "NI225"] },

  // Tier 2: Important — move specific sectors
  "retail sales mom":           { impact: "medium", affects: ["SPX", "DXY"] },
  "retail sales yoy":           { impact: "medium", affects: ["SPX"] },
  "pmi":                        { impact: "medium", affects: ["SPX", "DXY"] },
  "manufacturing pmi":          { impact: "medium", affects: ["SPX", "DXY"] },
  "services pmi":               { impact: "medium", affects: ["SPX", "DXY"] },
  "consumer confidence":        { impact: "medium", affects: ["SPX"] },
  "ism manufacturing":          { impact: "medium", affects: ["SPX", "DXY"] },
  "ism services":               { impact: "medium", affects: ["SPX"] },
  "industrial production":      { impact: "medium", affects: ["SPX"] },
  "trade balance":              { impact: "medium", affects: ["DXY"] },
  "housing starts":             { impact: "medium", affects: ["SPX"] },
  "building permits":           { impact: "medium", affects: ["SPX"] },
  "initial jobless claims":     { impact: "medium", affects: ["SPX", "DXY"] },
  "durable goods orders":       { impact: "medium", affects: ["SPX"] },
  "existing home sales":        { impact: "medium", affects: ["SPX"] },
  "new home sales":             { impact: "medium", affects: ["SPX"] },
  "crude oil inventories":      { impact: "medium", affects: ["CL", "XLE"] },
  "bi rate":                    { impact: "high", affects: ["USDIDR", "IHSG"] },
  "indonesia gdp":              { impact: "high", affects: ["USDIDR", "IHSG"] },
};

function scoreEvent(event: string, country: string): { impact: Impact; affects: string[] } | null {
  const eLower = event.toLowerCase();

  // Direct match
  for (const [key, val] of Object.entries(IMPACT_MAP)) {
    if (eLower.includes(key)) return val;
  }

  // Country-specific GDP/inflation/rate catch-all
  if (eLower.includes("gdp")) return { impact: "medium", affects: ["SPX"] };
  if (eLower.includes("inflation")) return { impact: "medium", affects: ["DXY"] };
  if (eLower.includes("interest rate")) return { impact: "high", affects: ["DXY"] };
  if (eLower.includes("employment") || eLower.includes("payroll")) return { impact: "medium", affects: ["SPX", "DXY"] };

  return null;
}

export class TradingEconomicsAdapter implements SourceAdapter {
  readonly code = "TE";
  readonly name = "Trading Economics Calendar";

  async fetch(ctx: AdapterContext): Promise<Candidate[]> {
    let html: string;
    try {
      html = await fetchText(CALENDAR_URL, {
        accept: "text/html",
      });
    } catch (err) {
      ctx.logger.warn({ err: String(err) }, "tradingeconomics fetch failed");
      return [];
    }

    const $ = cheerio.load(html);
    const out: Candidate[] = [];
    let skipped = 0;

    $("tr[data-event]").each((_, el) => {
      const $row = $(el);
      const event = $row.attr("data-event") ?? "";
      const country = $row.attr("data-country") ?? "";
      const category = $row.attr("data-category") ?? "";
      const url = $row.attr("data-url") ?? "";
      const id = $row.attr("data-id") ?? "";

      if (!event || !country) return;

      // Only focus countries
      if (!FOCUS_COUNTRIES.has(country.toLowerCase())) {
        skipped++;
        return;
      }

      // Score it ourselves
      const score = scoreEvent(event, country);
      if (!score) {
        skipped++;
        return;
      }

      const tds = $row.find("td").map((_, td) => $(td).text().trim()).get();
      const time = tds[0] ?? "";
      const countryCode = tds[2] ?? country.slice(0, 2).toUpperCase();

      const absUrl = url ? `${BASE}${url}` : CALENDAR_URL;
      const externalId = `te:${id || stableHash(event + country + time)}`;

      const rawText = [
        `${countryCode} — ${event}`,
        `Scheduled: ${time || "TBD"}`,
        `Category: ${category || event}`,
        `TradeVantage Impact Score: ${score.impact.toUpperCase()}`,
        `Affects: ${score.affects.join(", ")}`,
      ].join("\n");

      out.push({
        externalId,
        sourceUrl: absUrl,
        rawText,
        meta: {
          country: countryCode,
          event,
          time,
          category,
        },
        canonicalAffects: score.affects,
        canonicalImpact: score.impact,
      });
    });

    ctx.logger.info(
      { kept: out.length, skipped },
      "tradingeconomics: filter summary"
    );

    return dedupeByExternalId(out).slice(0, 20);
  }
}

function stableHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}
