import * as cheerio from "cheerio";
import { fetchText } from "../lib/http";
import type { AdapterContext, Candidate, SourceAdapter } from "./base";

/**
 * S&P Dow Jones Indices — the entire `www.spglobal.com/spdji/` hostname is
 * behind a Cloudflare edge that requires a real browser JS challenge; no
 * header combination gets a 200 from a plain HTTP client. This adapter is
 * kept as a graceful no-op for now.
 *
 * To actually ingest SPDJI you'd need one of:
 *   1. A headless browser worker (playwright) that completes the JS challenge.
 *   2. A paid Cloudflare-bypass service (FlareSolverr, ScrapFly, Bright Data).
 *   3. An RSS or API partnership with S&P.
 *
 * We disable the source in the DB via migration 0006 so the scheduler skips
 * it. If you flip `sources.enabled = true` for 'SPDJI' manually, this adapter
 * will attempt the fetch and log a warning on failure rather than crashing.
 */
export class SpdjiAdapter implements SourceAdapter {
  readonly code = "SPDJI";
  readonly name = "S&P Dow Jones Indices";

  async fetch(ctx: AdapterContext): Promise<Candidate[]> {
    const url = "https://www.spglobal.com/spdji/en/news-research/";
    try {
      const html = await fetchText(url, { retries: 1 });
      const $ = cheerio.load(html);
      const out: Candidate[] = [];

      $("a").each((_, el) => {
        const href = $(el).attr("href") ?? "";
        const title = $(el).text().trim();
        if (!title || title.length < 20) return;
        if (!/news|release|announcement|rebalance|methodology/i.test(href + title)) return;

        const absUrl = href.startsWith("http")
          ? href
          : `https://www.spglobal.com${href}`;
        out.push({
          externalId: absUrl,
          sourceUrl: absUrl,
          rawText: `${title}\n\nSource: S&P Dow Jones Indices — ${absUrl}`,
          meta: { href: absUrl },
        });
      });

      return dedupe(out).slice(0, 8);
    } catch (err) {
      ctx.logger.warn({ err: String(err) }, "spdji unavailable (Cloudflare)");
      return [];
    }
  }
}

function dedupe(items: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  return items.filter((c) => {
    if (seen.has(c.externalId)) return false;
    seen.add(c.externalId);
    return true;
  });
}
