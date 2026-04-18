import { config } from "../lib/config";
import { fetchText } from "../lib/http";
import type { AdapterContext, Candidate, SourceAdapter } from "./base";

/**
 * ForexFactory economic calendar adapter. ForexFactory has no official API;
 * the canonical free feed is the weekly XML dump mirrored at
 * `nfs.faireconomy.media/ff_calendar_thisweek.xml` (stable since ~2012).
 * Override via `FOREXFACTORY_RSS_URL` if the mirror moves.
 *
 * Feed shape (one entry per scheduled print):
 *   <event>
 *     <title>Core Retail Sales m/m</title>
 *     <country>USD</country>
 *     <date>04-22-2026</date>
 *     <time>8:30am</time>       (or "All Day", "Tentative", "")
 *     <impact>High</impact>
 *     <forecast>0.3%</forecast>
 *     <previous>0.4%</previous>
 *     <url>https://www.forexfactory.com/...</url>
 *   </event>
 *
 * Each event becomes one Candidate. Dedupe externalId is a stable hash of
 * (title|country|date|time) so re-parsing the same feed is a no-op.
 *
 * Timezone: the feed publishes times in US Eastern (the FF editorial tz).
 * We parse with an EDT offset (-04:00) as a best-effort. Drift across the
 * DST boundary is ≤1h and acceptable given these are low-frequency macro
 * events consumed at the day-scope. If the string is unparseable we emit
 * no `occurredAt` and let persist() fall back to the fetch timestamp.
 */
export class ForexFactoryAdapter implements SourceAdapter {
  readonly code = "FF";
  readonly name = "ForexFactory Economic Calendar";

  async fetch(ctx: AdapterContext): Promise<Candidate[]> {
    const url =
      config.FOREXFACTORY_RSS_URL ??
      "https://nfs.faireconomy.media/ff_calendar_thisweek.xml";
    let xml: string;
    try {
      xml = await fetchText(url, {
        accept: "application/xml, text/xml;q=0.9, */*;q=0.8",
      });
    } catch (err) {
      ctx.logger.warn({ err: String(err), url }, "forexfactory fetch failed");
      throw err;
    }

    const events = extractEvents(xml);
    const out: Candidate[] = [];
    for (const ev of events) {
      const title = cleanText(ev.title ?? "");
      const country = cleanText(ev.country ?? "");
      if (!title || !country) continue;

      const date = cleanText(ev.date ?? "");
      const time = cleanText(ev.time ?? "");
      const impact = cleanText(ev.impact ?? "");
      const forecast = cleanText(ev.forecast ?? "");
      const previous = cleanText(ev.previous ?? "");
      const sourceUrl = cleanText(ev.url ?? "") || url;

      const externalId = stableId([title, country, date, time]);

      const rawText = [
        `${country} — ${title}`,
        `Impact: ${impact || "n/a"} | Forecast: ${
          forecast || "n/a"
        } | Previous: ${previous || "n/a"}`,
      ].join("\n");

      const occurredAt = parseFfDateTime(date, time);

      out.push({
        externalId,
        sourceUrl,
        rawText,
        meta: {
          country,
          impact,
          forecast,
          previous,
          fxTitle: title,
          fxDate: date,
          fxTime: time,
        },
        occurredAt,
      });
    }
    return dedupe(out);
  }
}

interface FfEvent {
  title?: string;
  country?: string;
  date?: string;
  time?: string;
  impact?: string;
  forecast?: string;
  previous?: string;
  url?: string;
}

/**
 * Extract `<event>…</event>` blocks. Deliberately minimal — the feed is
 * a flat list of events wrapped in a `<weeklyevents>` root, no namespaces,
 * no CDATA in the ones we care about. If the upstream ever switches to
 * CDATA payloads, `readTag` already handles it.
 */
function extractEvents(xml: string): FfEvent[] {
  const out: FfEvent[] = [];
  const re = /<event\b[^>]*>([\s\S]*?)<\/event>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    if (!block) continue;
    out.push({
      title: readTag(block, "title"),
      country: readTag(block, "country"),
      date: readTag(block, "date"),
      time: readTag(block, "time"),
      impact: readTag(block, "impact"),
      forecast: readTag(block, "forecast"),
      previous: readTag(block, "previous"),
      url: readTag(block, "url"),
    });
  }
  return out;
}

function readTag(block: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(re);
  const inner = match?.[1];
  if (inner === undefined) return undefined;
  return unwrapCdata(inner).trim();
}

function unwrapCdata(s: string): string {
  const cdata = s.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata?.[1] ?? s;
}

function cleanText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Parse ForexFactory's "MM-DD-YYYY" date and "H:MMam/pm" or "All Day" /
 * "Tentative" time strings into an ISO UTC timestamp. Assumes the feed's
 * editorial tz is US Eastern with an EDT offset (-04:00). Returns undefined
 * on unparseable inputs so persist() falls back to fetch time.
 */
function parseFfDateTime(date: string, time: string): string | undefined {
  const dm = date.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!dm) return undefined;
  const mm = dm[1]!;
  const dd = dm[2]!;
  const yyyy = dm[3]!;

  let hh = 0;
  let min = 0;
  const tm = time.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (tm) {
    hh = parseInt(tm[1]!, 10) % 12;
    min = parseInt(tm[2]!, 10);
    if (tm[3]!.toLowerCase() === "pm") hh += 12;
  } else if (!/^(all day|tentative)?$/i.test(time.trim())) {
    // Unknown time format — treat as day-scope event at midnight ET.
  }

  const iso = `${yyyy}-${mm}-${dd}T${String(hh).padStart(2, "0")}:${String(min).padStart(2, "0")}:00-04:00`;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toISOString() : undefined;
}

/**
 * Stable, collision-resistant externalId from a tuple of strings. Uses a
 * djb2-style hash — same pattern persist.contentHash uses downstream.
 */
function stableId(parts: string[]): string {
  const s = parts.join("|");
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  // Unsigned hex, prefixed so the id is obviously synthetic.
  return `ff:${(h >>> 0).toString(16)}`;
}

function dedupe(items: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  return items.filter((c) => {
    if (seen.has(c.externalId)) return false;
    seen.add(c.externalId);
    return true;
  });
}
