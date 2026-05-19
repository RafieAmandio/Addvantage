import * as cheerio from "cheerio";
import {
  dedupeByExternalId,
  type AdapterContext,
  type Candidate,
  type SourceAdapter,
} from "../base";
import { config } from "../../lib/config";

const BASE = "https://www.thekobeissiletter.com";
const NEWSLETTERS_URL = `${BASE}/analysis/newsletters`;

function getToken(): string | null {
  return (config as Record<string, unknown>).KOBEISSI_TOKEN as string | null ?? null;
}

async function fetchAuth(url: string, token: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(`Auth failed (${res.status}) — token may be expired`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

export class KobeissiAdapter implements SourceAdapter {
  readonly code = "KBL";
  readonly name = "The Kobeissi Letter";

  async fetch(ctx: AdapterContext): Promise<Candidate[]> {
    const token = getToken();
    if (!token) {
      ctx.logger.warn(
        "kobeissi: KOBEISSI_TOKEN not set — add your Memberstack bearer token to apps/worker/.env"
      );
      return [];
    }

    try {
      const html = await fetchAuth(NEWSLETTERS_URL, token);

      if (html.includes("sign-in") && html.length < 5000) {
        ctx.logger.warn("kobeissi: session expired — update KOBEISSI_TOKEN");
        return [];
      }

      const $ = cheerio.load(html);
      const links: { href: string; text: string }[] = [];

      $("a").each((_, el) => {
        const href = $(el).attr("href") ?? "";
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (
          text.length > 5 &&
          (href.includes("/newsletter") || href.includes("/analysis/"))
        ) {
          const absUrl = href.startsWith("http") ? href : `${BASE}${href}`;
          links.push({ href: absUrl, text });
        }
      });

      ctx.logger.info(
        { count: links.length },
        "kobeissi: found newsletter links"
      );

      const out: Candidate[] = [];

      for (const link of dedupeKblLinks(links).slice(0, 5)) {
        try {
          const article = await this.extractArticle(link.href, link.text, token);
          if (article) out.push(article);
        } catch (err) {
          ctx.logger.warn(
            { err: String(err), url: link.href },
            "kobeissi: failed to extract article"
          );
        }
      }

      return dedupeByExternalId(out);
    } catch (err) {
      ctx.logger.warn({ err: String(err) }, "kobeissi: fetch failed");
      return [];
    }
  }

  private async extractArticle(
    url: string,
    fallbackTitle: string,
    token: string
  ): Promise<Candidate | null> {
    const html = await fetchAuth(url, token);
    const $ = cheerio.load(html);

    $("nav, footer, script, style, header, aside, [class*='sidebar'], [class*='menu'], [class*='cookie'], [class*='share'], [class*='social'], [class*='related'], [class*='comment'], [class*='subscribe']").remove();

    const title =
      $("h1").first().text().trim() ||
      $("title").text().trim() ||
      fallbackTitle;

    const body = this.extractBodyText($);

    if (!body || body.length < 100) return null;

    return {
      externalId: url,
      sourceUrl: url,
      rawText: `The Kobeissi Letter — ${title}\n\n${body.slice(0, 8000)}`,
      meta: { title, url },
    };
  }

  private extractBodyText($: cheerio.CheerioAPI): string {
    const selectors = [
      "article",
      '[class*="newsletter"]',
      '[class*="rich-text"]',
      '[class*="blog-content"]',
      '[class*="post-content"]',
      '[class*="content"]',
      '[class*="post-body"]',
      '[class*="entry-content"]',
      '[class*="article-body"]',
      '[data-content]',
      "main",
    ];

    for (const sel of selectors) {
      const el = $(sel);
      if (el.length) {
        const text = el.text().replace(/\s+/g, " ").trim();
        if (text.length > 200) return text;
      }
    }

    // Paragraph-gathering fallback: collect all <p> tags from body
    const paragraphs: string[] = [];
    $("body p").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length > 30) paragraphs.push(text);
    });
    if (paragraphs.join(" ").length > 200) {
      return paragraphs.join("\n\n");
    }

    const body = $("body").text().replace(/\s+/g, " ").trim();
    return body;
  }
}

function dedupeKblLinks(links: { href: string; text: string }[]) {
  const seen = new Set<string>();
  return links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });
}
