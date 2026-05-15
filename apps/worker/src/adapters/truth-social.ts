import { config } from "../lib/config";
import { fetchText } from "../lib/http";
import { openai } from "../lib/openai";
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

    const items = extractItems(xml).slice(0, 5);
    const out: Candidate[] = [];
    for (const item of items) {
      const link = item.link ?? item.guid;
      if (!link) continue;
      const externalId = item.guid ?? link;
      const title = cleanText(item.title ?? "");
      const body = cleanText(stripHtml(item.description ?? ""));
      const imageUrls = extractImageUrls(item.description ?? "");
      let rawText = [title, body].filter(Boolean).join("\n\n").trim();

      // If the post has little/no text, fetch the post page to find images
      const textOnly = body.trim();
      if (textOnly.length === 0) {
        const pageImages = imageUrls.length > 0
          ? imageUrls
          : await scrapePostImages(link, ctx);

        if (pageImages.length > 0) {
          try {
            const described = await describeImage(pageImages[0], ctx);
            rawText = [title, `[Image content]: ${described}`]
              .filter(Boolean)
              .join("\n\n")
              .trim();
          } catch (err) {
            ctx.logger.warn({ err: String(err), url: pageImages[0] }, "vision describe failed");
          }
        }
      }

      if (!rawText || rawText.length < 10) continue;

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
          hasImage: imageUrls.length > 0 ? "true" : "false",
        },
        occurredAt,
      });
    }
    return dedupeByExternalId(out);
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

async function scrapePostImages(
  postUrl: string,
  ctx: AdapterContext,
): Promise<string[]> {
  try {
    const html = await fetchText(postUrl);
    return extractImageUrls(html);
  } catch (err) {
    ctx.logger.warn({ err: String(err), url: postUrl }, "truth-social: failed to scrape post page");
    return [];
  }
}

function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const src = m[1];
    if (!src) continue;
    if (src.includes("emoji") || src.includes("avatar") || src.includes("favicon") || src.includes("logo") || src.endsWith(".svg")) continue;
    urls.push(src);
  }
  // Prefer full-size images (archive URLs or "original" in path) over thumbnails
  urls.sort((a, b) => {
    const aFull = a.includes("archive") || a.includes("original") ? 0 : 1;
    const bFull = b.includes("archive") || b.includes("original") ? 0 : 1;
    return aFull - bFull;
  });
  return urls;
}

async function downloadImageAsBase64(url: string): Promise<{ base64: string; mediaType: string }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const mediaType = contentType.split(";")[0].trim();
  return { base64: buf.toString("base64"), mediaType };
}

async function describeImage(
  imageUrl: string,
  ctx: AdapterContext,
): Promise<string> {
  ctx.logger.info({ url: imageUrl }, "vision: describing image");
  const { base64, mediaType } = await downloadImageAsBase64(imageUrl);

  const baseURL = config.LLM_BASE_URL ?? (config.LLM_PROVIDER === "openlimits" ? "https://openlimits.app" : "https://api.anthropic.com");

  const res = await fetch(`${baseURL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.LLM_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      stream: false,
      thinking: { type: "disabled" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: "Read and transcribe ALL text in this image. If it's a screenshot of a statement, article, or social media post, extract the full text verbatim. If it's a chart or graph, describe what it shows including any numbers, labels, and trends. Be thorough — every word matters for market analysis.",
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`vision API ${res.status}: ${err.slice(0, 200)}`);
  }

  // OpenLimits may return SSE even with stream:false — parse both formats
  const raw = await res.text();
  let text: string | undefined;

  if (raw.startsWith("{")) {
    const json = JSON.parse(raw) as { content?: Array<{ type: string; text?: string }> };
    text = json.content?.find((c) => c.type === "text")?.text?.trim();
  } else {
    // Parse SSE: collect text deltas from content_block_delta events
    const textChunks: string[] = [];
    for (const line of raw.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const evt = JSON.parse(line.slice(6));
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          textChunks.push(evt.delta.text);
        }
      } catch {}
    }
    text = textChunks.join("").trim();
  }

  if (!text) throw new Error("vision: empty response");
  return text;
}

