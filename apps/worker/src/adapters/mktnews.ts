import { fetchJson } from "../lib/http";
import { dedupeByExternalId, type AdapterContext, type Candidate, type SourceAdapter } from "./base";

/**
 * MKT News adapter — polls the public mktnews.net flash API for important
 * market headlines and keeps the US-relevant ones. The flash feed is a stream
 * of terse, time-stamped market blurbs already tagged with a per-symbol
 * directional impact (bullish/bearish). We forward those tags to the LLM as
 * adapter hints (not canonical overrides) so the rephrase desk can derive its
 * own bias/affects while anchored to the source's read.
 *
 * Endpoint (no auth):
 *   https://api.mktnews.net/api/flash?important=1&limit=50
 *
 * Response shape:
 *   { status: 200, data: [{
 *       id, time, important, data: { content, title },
 *       impact: [{ impact: "bullish"|"bearish"|"none", symbol }] | null
 *   }] }
 *
 * Each flash becomes one Candidate. externalId is `mkt:<id>` so re-polling the
 * same flash is a no-op (persist dedupes on content_hash of source+externalId).
 */

const FLASH_URL = "https://api.mktnews.net/api/flash?important=1&limit=50";

/** How far back a flash can be and still be ingested. Worker polls hourly; a
 * 6h window tolerates missed ticks while dedupe absorbs the overlap. */
const MAX_AGE_HOURS = 6;

/** Index symbols that count as US-relevant even without a `.O`/`.N` suffix. */
const US_SYMBOLS = new Set(["S&P500", "SPX", "DJI", "Dow", "Nasdaq", "Russell", "DXY"]);

interface MktNewsFlashItem {
  id: string;
  time: string;
  important: 0 | 1;
  data: { content: string; title: string | null };
  impact: Array<{ impact: "bullish" | "bearish" | "none"; symbol: string }> | null;
}

interface MktNewsResponse {
  status: number;
  data: MktNewsFlashItem[];
}

export class MktNewsAdapter implements SourceAdapter {
  readonly code = "MKT";
  readonly name = "MKT News — Market Flash";

  async fetch(ctx: AdapterContext): Promise<Candidate[]> {
    let json: MktNewsResponse;
    try {
      json = await fetchJson<MktNewsResponse>(FLASH_URL, {
        headers: { "user-agent": "TradeVantage-Worker/1.0" },
      });
    } catch (err) {
      ctx.logger.warn({ err: String(err), url: FLASH_URL }, "mktnews fetch failed");
      throw err;
    }

    if (json.status !== 200 || !Array.isArray(json.data)) {
      ctx.logger.warn({ status: json.status }, "mktnews: unexpected response");
      return [];
    }

    const out: Candidate[] = [];
    let skippedOld = 0;
    let skippedIrrelevant = 0;

    for (const entry of json.data) {
      if (!isRecent(entry.time, MAX_AGE_HOURS)) {
        skippedOld++;
        continue;
      }
      if (!isUSRelevant(entry.impact)) {
        skippedIrrelevant++;
        continue;
      }

      const content = entry.data.content?.trim();
      if (!content || content.length < 20) continue;

      const title = entry.data.title?.trim();
      const symbols = relevantSymbols(entry.impact);
      const impactLine = formatImpactLine(entry.impact);

      // Build a richer rawText: title + content + a plain-English impact line.
      // This gives the LLM directional context and clears persist()'s 60-char
      // thin-candidate gate for otherwise-terse flashes.
      const rawText = [title ? `${title}` : null, content, impactLine]
        .filter(Boolean)
        .join("\n");

      out.push({
        externalId: `mkt:${entry.id}`,
        sourceUrl: "https://www.mktnews.net",
        rawText,
        occurredAt: parseIso(entry.time),
        meta: {
          ...(symbols.length ? { symbols: symbols.join(",") } : {}),
          ...(impactLine ? { impactHint: impactLine } : {}),
        },
      });
    }

    const deduped = dedupeByExternalId(out);
    ctx.logger.debug(
      { kept: deduped.length, skippedOld, skippedIrrelevant, scope: "mkt.fetch" },
      "mktnews filter summary",
    );
    return deduped;
  }
}

function isRecent(dateStr: string, maxAgeHours: number): boolean {
  const published = new Date(dateStr).getTime();
  if (Number.isNaN(published)) return true; // keep undateable items; dedupe still guards
  return Date.now() - published < maxAgeHours * 60 * 60 * 1000;
}

function isUSRelevant(impact: MktNewsFlashItem["impact"]): boolean {
  if (!impact || impact.length === 0) return false;
  return impact.some(
    (i) => i.symbol.endsWith(".O") || i.symbol.endsWith(".N") || US_SYMBOLS.has(i.symbol),
  );
}

function relevantSymbols(impact: MktNewsFlashItem["impact"]): string[] {
  if (!impact) return [];
  return [...new Set(impact.filter((i) => i.impact !== "none").map((i) => i.symbol))];
}

function formatImpactLine(impact: MktNewsFlashItem["impact"]): string {
  if (!impact || impact.length === 0) return "";
  const parts = impact
    .filter((i) => i.impact !== "none")
    .map((i) => `${i.impact.toUpperCase()} on ${i.symbol}`);
  return parts.length > 0 ? `Source-flagged impact: ${parts.join(", ")}.` : "";
}

function parseIso(dateStr: string): string | undefined {
  const d = new Date(dateStr);
  return Number.isFinite(d.getTime()) ? d.toISOString() : undefined;
}
