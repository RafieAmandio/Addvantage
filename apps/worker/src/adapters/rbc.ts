import * as cheerio from "cheerio";
import { fetchText } from "../lib/http";
import { dedupeByExternalId, type AdapterContext, type Candidate, type SourceAdapter } from "./base";

/**
 * RBC Wealth Management — Asia Insights landing. Real articles live at
 * `/en-asia/insights/<slug>` and the anchor text is prefixed with
 * "X minute read – <title>". We strip the prefix and emit one Candidate per
 * article, ignoring navigation / language-switcher / region-switcher links.
 */
const READ_TIME_PREFIX = /^\d+\s*minute\s+read\s*[–-]\s*/i;

export class RbcAdapter implements SourceAdapter {
  readonly code = "RBC";
  readonly name = "RBC Wealth Management — Asia Insights";

  async fetch(ctx: AdapterContext): Promise<Candidate[]> {
    const landing = "https://www.rbcwealthmanagement.com/en-asia/insights";
    try {
      const html = await fetchText(landing);
      const $ = cheerio.load(html);
      const out: Candidate[] = [];

      $('a[href*="/en-asia/insights/"]').each((_, el) => {
        const href = $(el).attr("href") ?? "";
        const raw = $(el).text().replace(/\s+/g, " ").trim();
        if (!raw) return;

        // Only article URLs — i.e. have a slug after `/insights/`.
        const match = href.match(/\/en-asia\/insights\/([^/?#]+)/);
        if (!match) return;
        const slug = match[1];
        if (!slug || slug.length < 4) return;

        // Skip the "Insights" nav link itself (no slug).
        if (href.endsWith("/insights") || href.endsWith("/insights/")) return;

        const title = raw.replace(READ_TIME_PREFIX, "").trim();
        if (title.length < 10) return;

        const absUrl = href.startsWith("http")
          ? href
          : new URL(href, landing).toString();

        out.push({
          externalId: absUrl,
          sourceUrl: absUrl,
          rawText: `RBC Wealth Management (Asia) — ${title}\n\nLink: ${absUrl}`,
          meta: { title, slug, href: absUrl },
        });
      });

      return dedupeByExternalId(out).slice(0, 10);
    } catch (err) {
      ctx.logger.warn({ err: String(err) }, "rbc fetch failed");
      return [];
    }
  }
}
