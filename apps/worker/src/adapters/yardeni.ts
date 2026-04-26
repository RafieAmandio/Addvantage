import * as cheerio from "cheerio";
import { fetchText } from "../lib/http";
import { dedupeByExternalId, type AdapterContext, type Candidate, type SourceAdapter } from "./base";

/**
 * Yardeni Research — homepage hero lists the latest Morning Briefings and
 * QuickTakes as dated cards. Each card links to `/research/morning-briefing/YYYY/MM/DD/<slug>`
 * or `/research/quicktakes/YYYY/MM/DD/<slug>`. We key off those URL patterns
 * and emit one Candidate per unique article, pulling the headline from the
 * closest ancestor card's heading element.
 */
export class YardeniAdapter implements SourceAdapter {
  readonly code = "YRD";
  readonly name = "Yardeni Research";

  async fetch(ctx: AdapterContext): Promise<Candidate[]> {
    const landing = "https://yardeni.com/";
    try {
      const html = await fetchText(landing);
      const $ = cheerio.load(html);
      const out: Candidate[] = [];

      $(
        'a[href*="/research/morning-briefing/"], a[href*="/research/quicktakes/"]'
      ).each((_, el) => {
        const href = $(el).attr("href") ?? "";
        // Only dated article URLs, not the index pages
        if (!/\/research\/(morning-briefing|quicktakes)\/\d{4}\/\d{2}\/\d{2}\//.test(href)) {
          return;
        }
        const absUrl = href.startsWith("http")
          ? href
          : new URL(href, landing).toString();

        const card = $(el).closest("article, section, li, div");
        const heading = card
          .find("h1,h2,h3,h4,h5")
          .first()
          .text()
          .replace(/\s+/g, " ")
          .trim();
        const fallback = slugToTitle(href);
        const title = heading || fallback;
        const dateMatch = href.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
        const date = dateMatch
          ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
          : null;
        const kind = /morning-briefing/.test(href)
          ? "Morning Briefing"
          : "QuickTake";

        out.push({
          externalId: absUrl,
          sourceUrl: absUrl,
          rawText: `Yardeni Research — ${kind} · ${title}${
            date ? ` (published ${date})` : ""
          }\n\nLink: ${absUrl}`,
          meta: { title, href: absUrl, kind, date: date ?? "" },
          occurredAt: date
            ? new Date(`${date}T12:00:00Z`).toISOString()
            : undefined,
        });
      });

      return dedupeByExternalId(out).slice(0, 10);
    } catch (err) {
      ctx.logger.warn({ err: String(err) }, "yardeni fetch failed");
      return [];
    }
  }
}

function slugToTitle(href: string): string {
  const slug = href.split("/").filter(Boolean).pop() ?? "";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
