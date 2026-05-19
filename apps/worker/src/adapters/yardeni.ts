import * as cheerio from "cheerio";
import { fetchText } from "../lib/http";
import { dedupeByExternalId, type AdapterContext, type Candidate, type SourceAdapter } from "./base";

/**
 * Yardeni Research — scrapes homepage for Morning Briefing and QuickTake links,
 * then attempts to fetch each article page for full body text. Articles are
 * paywalled, so extraction often falls back to the headline — the thin-content
 * guard in persist.ts will skip items with < 120 chars of raw text.
 */
export class YardeniAdapter implements SourceAdapter {
  readonly code = "YRD";
  readonly name = "Yardeni Research";

  async fetch(ctx: AdapterContext): Promise<Candidate[]> {
    const landing = "https://yardeni.com/";
    try {
      const html = await fetchText(landing);
      const $ = cheerio.load(html);
      const links: { href: string; title: string; kind: string; date: string | null }[] = [];

      $(
        'a[href*="/research/morning-briefing/"], a[href*="/research/quicktakes/"]'
      ).each((_, el) => {
        const href = $(el).attr("href") ?? "";
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
        const title = heading || slugToTitle(href);
        const dateMatch = href.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
        const date = dateMatch
          ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
          : null;
        const kind = /morning-briefing/.test(href)
          ? "Morning Briefing"
          : "QuickTake";

        links.push({ href: absUrl, title, kind, date });
      });

      const unique = dedupeLinks(links);
      const out: Candidate[] = [];

      for (const link of unique.slice(0, 6)) {
        try {
          const body = await this.extractBody(link.href);
          const rawText = body
            ? `Yardeni Research — ${link.kind} · ${link.title}${link.date ? ` (${link.date})` : ""}\n\n${body}`
            : `Yardeni Research — ${link.kind} · ${link.title}${link.date ? ` (${link.date})` : ""}\n\nLink: ${link.href}`;

          out.push({
            externalId: link.href,
            sourceUrl: link.href,
            rawText,
            meta: { title: link.title, href: link.href, kind: link.kind, date: link.date ?? "" },
            occurredAt: link.date
              ? new Date(`${link.date}T12:00:00Z`).toISOString()
              : undefined,
          });
        } catch (err) {
          ctx.logger.warn({ err: String(err), url: link.href }, "yardeni: article fetch failed, using headline");
          out.push({
            externalId: link.href,
            sourceUrl: link.href,
            rawText: `Yardeni Research — ${link.kind} · ${link.title}${link.date ? ` (${link.date})` : ""}\n\nLink: ${link.href}`,
            meta: { title: link.title, href: link.href, kind: link.kind, date: link.date ?? "" },
            occurredAt: link.date
              ? new Date(`${link.date}T12:00:00Z`).toISOString()
              : undefined,
          });
        }
      }

      return dedupeByExternalId(out);
    } catch (err) {
      ctx.logger.warn({ err: String(err) }, "yardeni fetch failed");
      return [];
    }
  }

  private async extractBody(url: string): Promise<string | null> {
    const html = await fetchText(url, { retries: 1, timeoutMs: 15_000 });
    const $ = cheerio.load(html);

    $("nav, footer, script, style, header, aside, [class*='sidebar'], [class*='menu'], [class*='cookie'], [class*='share'], [class*='social']").remove();

    const selectors = [
      "article",
      '[class*="post-content"]',
      '[class*="entry-content"]',
      '[class*="article-body"]',
      '[class*="content-area"]',
      ".post-body",
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

function slugToTitle(href: string): string {
  const slug = href.split("/").filter(Boolean).pop() ?? "";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function dedupeLinks(links: { href: string; title: string; kind: string; date: string | null }[]) {
  const seen = new Set<string>();
  return links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });
}
