import * as cheerio from "cheerio";
import { prisma, type Prisma } from "@tradevantage/db";
import { fetchText } from "../lib/http";
import { logger } from "../lib/logger";

/**
 * Released figures for the calendar. The ForexFactory JSON feed has no "actual" field, so the
 * numbers come from Myfxbook's public calendar RSS (today's events, UTC, not CDN cached).
 * Runs every minute but only fetches while a release is inside its window, so the feed sees
 * at most one request a minute around releases and none otherwise.
 */
const RSS_URL = "https://www.myfxbook.com/rss/forex-economic-calendar-events";
// ponytail: 15 min window per the owner's ask; a figure Myfxbook posts later than that waits for nothing.
const WINDOW_MS = 15 * 60_000;

// Myfxbook country slug (from the item link) to the country code the timeline stores.
const SLUG_COUNTRY: Record<string, string> = {
  "united-states": "US", "euro-area": "EU", "european-union": "EU", germany: "EU", france: "EU", italy: "EU",
  spain: "EU", "united-kingdom": "UK", japan: "JP", china: "CN", australia: "AU", canada: "CA",
  switzerland: "CH", "new-zealand": "NZ",
};
// ForexFactory files euro members under EUR with an adjective ("German ZEW ..."); keep that word.
const SLUG_ADJECTIVE: Record<string, string> = { germany: "German", france: "French", italy: "Italian", spain: "Spanish" };

export interface Release {
  country: string;
  at: number; // epoch ms, minute precision
  name: string;
  previous: string;
  consensus: string;
  actual: string;
}

export interface Pending {
  country: string;
  at: number;
  name: string;
  previous: string | null;
  forecast: string | null;
}

export function parseRss(xml: string): Release[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  return $("item").toArray().flatMap((el) => {
    const item = $(el);
    const slug = item.find("link").text().match(/forex-economic-calendar\/([^/]+)\//)?.[1] ?? "";
    const country = SLUG_COUNTRY[slug];
    const at = Date.parse(item.find("pubDate").text());
    if (!country || Number.isNaN(at)) return [];
    // Description is an escaped table: time left, impact, previous, consensus, actual.
    const $d = cheerio.load(item.find("description").text());
    const cells = $d("td").toArray().map((td) => $d(td).text().trim());
    if (cells.length < 5) return [];
    const bare = item.find("title").text().replace(new RegExp(`^${slug.replace(/-/g, " ")}\\s+`, "i"), "");
    const name = SLUG_ADJECTIVE[slug] ? `${SLUG_ADJECTIVE[slug]} ${bare}` : bare;
    return [{ country, at, name, previous: cells[2]!, consensus: cells[3]!, actual: cells[4]! }];
  });
}

const tokens = (s: string) =>
  new Set(
    s.toLowerCase()
      .replace(/m\/m/g, "mom").replace(/y\/y/g, "yoy").replace(/q\/q/g, "qoq")
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );

const num = (s: string | null | undefined) => {
  const m = s?.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};
const sameNum = (a: string | null | undefined, b: string | null | undefined) => {
  const x = num(a);
  return x !== null && x === num(b);
};
// Previous prints more than 10% apart mean a different series (e.g. JP trade balance -0.70T vs -536.6B).
const conflicts = (a: string | null | undefined, b: string | null | undefined) => {
  const x = num(a);
  const y = num(b);
  return x !== null && y !== null && Math.abs(x - y) > 0.1 * Math.max(Math.abs(x), Math.abs(y));
};

/**
 * Best Myfxbook row for a ForexFactory event: same country and minute, then name overlap plus
 * agreement on previous (and forecast). Names differ between the two ("Core Retail Sales m/m" vs
 * "Retail Sales Ex Autos MoM"), the previous print is what tells them apart. Weak or tied matches
 * are skipped: a missing actual is better than a wrong one.
 */
export function matchRelease(ev: Pending, releases: Release[]): Release | null {
  const mine = tokens(ev.name);
  const scored = releases
    .filter((r) => r.country === ev.country && r.at === ev.at && r.actual && !conflicts(ev.previous, r.previous))
    .map((r) => {
      const theirs = tokens(r.name);
      const shared = [...mine].filter((t) => theirs.has(t)).length;
      const jaccard = shared / (mine.size + theirs.size - shared || 1);
      return { r, score: jaccard + (sameNum(ev.previous, r.previous) ? 1 : 0) + (sameNum(ev.forecast, r.consensus) ? 0.5 : 0) };
    })
    .sort((a, b) => b.score - a.score);
  const [best, next] = scored;
  if (!best || best.score < 0.6 || (next && next.score === best.score)) return null;
  return best.r;
}

export async function syncActuals(now = Date.now()): Promise<number> {
  const rows = await prisma.timelineEvent.findMany({
    where: { kind: "macro", sourceCode: "FF", occurredAt: { gte: new Date(now - WINDOW_MS), lte: new Date(now) } },
    select: { id: true, occurredAt: true, symbols: true, title: true, metadata: true },
  });
  const pending = rows.flatMap((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const previous = (meta.previous as string | null) ?? null;
    const forecast = (meta.forecast as string | null) ?? null;
    // Speeches and other events with neither number never get an actual.
    if (meta.actual || (!previous && !forecast)) return [];
    const country = row.symbols[0] ?? "";
    const name = row.title.replace(/^\S+\s+\S\s+/, ""); // drop the "US <dash> " prefix sync.ts writes
    return [{ row, meta, ev: { country, at: row.occurredAt.getTime(), name, previous, forecast } }];
  });
  if (pending.length === 0) return 0;

  const releases = parseRss(await fetchText(RSS_URL, { accept: "application/rss+xml", retries: 0 }));
  let updated = 0;
  for (const { row, meta, ev } of pending) {
    const hit = matchRelease(ev, releases);
    if (!hit) continue;
    await prisma.timelineEvent.update({
      where: { id: row.id },
      data: { metadata: { ...meta, actual: hit.actual } as Prisma.InputJsonValue },
    });
    updated++;
  }
  logger.info({ pending: pending.length, updated }, "calendar: actuals pass");
  return updated;
}
