import * as cheerio from "cheerio";
import { fetchText } from "../lib/http";
import { dedupeByExternalId, type AdapterContext, type Candidate, type SourceAdapter } from "./base";

/**
 * RBC Wealth Management — Asia Insights. Scrapes the landing page for article
 * links, then fetches each article to extract the full body text.
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
      const links: { href: string; title: string; slug: string }[] = [];

      $('a[href*="/en-asia/insights/"]').each((_, el) => {
        const href = $(el).attr("href") ?? "";
        const raw = $(el).text().replace(/\s+/g, " ").trim();
        if (!raw) return;

        const match = href.match(/\/en-asia\/insights\/([^/?#]+)/);
        if (!match) return;
        const slug = match[1];
        if (!slug || slug.length < 4) return;
        if (href.endsWith("/insights") || href.endsWith("/insights/")) return;

        const title = raw.replace(READ_TIME_PREFIX, "").trim();
        if (title.length < 10) return;

        const absUrl = href.startsWith("http")
          ? href
          : new URL(href, landing).toString();

        links.push({ href: absUrl, title, slug });
      });

      const unique = dedupeLinks(links);
      const out: Candidate[] = [];

      for (const link of unique.slice(0, 6)) {
        try {
          const body = await this.extractBody(link.href);
          const rawText = body
            ? `RBC Wealth Management (Asia) — ${link.title}\n\n${body}`
            : `RBC Wealth Management (Asia) — ${link.title}\n\nLink: ${link.href}`;

          out.push({
            externalId: link.href,
            sourceUrl: link.href,
            rawText,
            meta: { title: link.title, slug: link.slug, href: link.href },
          });
        } catch (err) {
          ctx.logger.warn({ err: String(err), url: link.href }, "rbc: article fetch failed, using headline");
          out.push({
            externalId: link.href,
            sourceUrl: link.href,
            rawText: `RBC Wealth Management (Asia) — ${link.title}\n\nLink: ${link.href}`,
            meta: { title: link.title, slug: link.slug, href: link.href },
          });
        }
      }

      return dedupeByExternalId(out);
    } catch (err) {
      ctx.logger.warn({ err: String(err) }, "rbc fetch failed");
      return [];
    }
  }

  private async extractBody(url: string): Promise<string | null> {
    const html = await fetchText(url, { retries: 1, timeoutMs: 15_000 });
    const $ = cheerio.load(html);

    $("nav, footer, script, style, header, aside, [class*='sidebar'], [class*='menu'], [class*='cookie'], [class*='share'], [class*='social'], [class*='related']").remove();

    const selectors = [
      "article",
      '[class*="article-body"]',
      '[class*="article-content"]',
      '[class*="insight-content"]',
      '[class*="post-content"]',
      '[class*="entry-content"]',
      '[class*="content-body"]',
      "main",
    ];

    for (const sel of selectors) {
      const el = $(sel);
      if (el.length) {
        const text = el.text().replace(/\s+/g, " ").trim();
        if (text.length > 200) return text.slice(0, 8000);
      }
    }

    const body = $("body").text().replace(/\s+/g, " ").trim();
    if (body.length > 200) return body.slice(0, 8000);

    return null;
  }
}

function dedupeLinks(links: { href: string; title: string; slug: string }[]) {
  const seen = new Set<string>();
  return links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });
}
