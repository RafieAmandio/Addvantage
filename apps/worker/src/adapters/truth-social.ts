import { config } from "../lib/config";
import { fetchText } from "../lib/http";
import { dedupeByExternalId, type AdapterContext, type Candidate, type SourceAdapter } from "./base";

/**
 * Truth Social adapter — polls a public RSS mirror of Donald Trump's Truth
 * Social posts (`trumpstruth.org/feed` by default, overridable via
 * `TRUTH_SOCIAL_RSS_URL`). Truth Social has no official API; this mirror is
 * the least-fragile public endpoint. We parse RSS 2.0 with a minimal regex
 * extractor rather than pull in a new dep for one adapter.
 *
 * Each `<item>` becomes one `Candidate`. Dedupe key downstream is
 * `contentHash([sourceCode, externalId, rawText])` where externalId is the
 * item guid/link (stable per post). The pipeline's rephrase layer then
 * summarises the post into the editorial tone.
 */
export class TruthSocialAdapter implements SourceAdapter {
  readonly code = "TRUMP";
  readonly name = "Donald Trump (Truth Social)";

  async fetch(ctx: AdapterContext): Promise<Candidate[]> {
    const url = config.TRUTH_SOCIAL_RSS_URL ?? "https://trumpstruth.org/feed";
    let xml: string;
    try {
      xml = await fetchText(url, {
        accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      });
    } catch (err) {
      ctx.logger.warn({ err: String(err), url }, "truth-social fetch failed");
      return [];
    }

    const items = extractItems(xml);
    const out: Candidate[] = [];
    for (const item of items) {
      const link = item.link ?? item.guid;
      if (!link) continue;
      const externalId = item.guid ?? link;
      const title = cleanText(item.title ?? "");
      const body = cleanText(stripHtml(item.description ?? ""));
      const rawText = [title, body].filter(Boolean).join("\n\n").trim();
      if (!rawText) continue;

      const occurredAt = item.pubDate
        ? parseRssDate(item.pubDate)
        : undefined;

      out.push({
        externalId,
        sourceUrl: link,
        rawText,
        meta: {
          title,
          link,
          pubDate: item.pubDate ?? "",
        },
        occurredAt,
      });
    }
    return dedupeByExternalId(out).slice(0, 20);
  }
}

interface RssItem {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  description?: string;
}

/**
 * Extract `<item>…</item>` blocks from an RSS 2.0 document. Deliberately
 * minimal — supports both CDATA and escaped-entity payloads, which covers
 * trumpstruth.org and most other mirrors. If we ever need Atom or namespaced
 * extensions, switch to `fast-xml-parser`.
 */
function extractItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const re = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    if (!block) continue;
    items.push({
      title: readTag(block, "title"),
      link: readTag(block, "link"),
      guid: readTag(block, "guid"),
      pubDate: readTag(block, "pubDate"),
      description: readTag(block, "description"),
    });
  }
  return items;
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

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function cleanText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function parseRssDate(s: string): string | undefined {
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d.toISOString() : undefined;
}

