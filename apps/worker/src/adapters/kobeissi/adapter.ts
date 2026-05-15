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

      for (const link of links.slice(0, 5)) {
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

    $("nav, footer, script, style, header, [class*='sidebar']").remove();

    const title =
      $("h1").first().text().trim() ||
      $("title").text().trim() ||
      fallbackTitle;

    let body = "";
    const selectors = [
      "article",
      '[class*="newsletter"]',
      '[class*="content"]',
      '[class*="post-body"]',
      '[class*="entry"]',
      "main",
    ];

    for (const sel of selectors) {
      const el = $(sel);
      if (el.length && el.text().trim().length > 200) {
        body = el.text().replace(/\s+/g, " ").trim();
        break;
      }
    }

    if (!body || body.length < 100) {
      body = $("body").text().replace(/\s+/g, " ").trim();
    }

    if (body.length < 100) return null;

    const rawText = body.slice(0, 8000);

    return {
      externalId: url,
      sourceUrl: url,
      rawText: `The Kobeissi Letter — ${title}\n\n${rawText}`,
      meta: { title, url },
    };
  }
}
