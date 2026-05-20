import { ai } from "../lib/ai";
import { config } from "../lib/config";
import { fetchText } from "../lib/http";
import { dedupeByExternalId, type AdapterContext, type Candidate, type SourceAdapter } from "./base";

/**
 * Truth Social adapter — polls a public RSS mirror of Donald Trump's Truth
 * Social posts. The RSS includes `truth:originalUrl` pointing to the actual
 * truthsocial.com post. For image-only posts, we scrape images from both the
 * mirror page and the original Truth Social page, preferring the
 * `static-assets-1.truthsocial.com` CDN which is globally reachable (the
 * `truth-archive` Linode CDN is often blocked).
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

    const items = extractItems(xml).slice(0, 10);
    const out: Candidate[] = [];
    for (const item of items) {
      const link = item.link ?? item.guid;
      if (!link) continue;
      const externalId = item.guid ?? link;
      const title = cleanText(item.title ?? "");
      const body = cleanText(stripHtml(item.description ?? ""));
      let rawText = [title, body].filter(Boolean).join("\n\n").trim();

      // For image-only posts, try to describe the image via vision
      if (body.trim().length === 0) {
        const imageUrl = await this.findImage(item, link, ctx);
        if (imageUrl) {
          try {
            const described = await describeImage(imageUrl, ctx);
            rawText = [title, `[Image content]: ${described}`]
              .filter(Boolean)
              .join("\n\n")
              .trim();
          } catch (err) {
            ctx.logger.warn({ err: String(err), url: imageUrl }, "vision describe failed");
          }
        }
      }

      if (!rawText || rawText.length < 10) continue;

      const occurredAt = item.pubDate
        ? parseRssDate(item.pubDate)
        : undefined;

      out.push({
        externalId,
        sourceUrl: item.originalUrl ?? link,
        rawText,
        meta: {
          title,
          link,
          pubDate: item.pubDate ?? "",
          hasImage: "true",
        },
        occurredAt,
      });
    }
    return dedupeByExternalId(out);
  }

  private async findImage(
    item: RssItem,
    mirrorUrl: string,
    ctx: AdapterContext,
  ): Promise<string | null> {
    // 1. Check RSS description for inline images
    const inlineImages = extractImageUrls(item.description ?? "");
    const cdnImage = pickCdnImage(inlineImages);
    if (cdnImage) return cdnImage;

    // 2. Scrape the mirror post page (trumpstruth.org)
    const mirrorImages = await scrapePageImages(mirrorUrl, ctx);
    const mirrorCdn = pickCdnImage(mirrorImages);
    if (mirrorCdn) return mirrorCdn;

    // 3. Scrape the original Truth Social page
    if (item.originalUrl) {
      const origImages = await scrapePageImages(item.originalUrl, ctx);
      const origCdn = pickCdnImage(origImages);
      if (origCdn) return origCdn;
    }

    // 4. Fall back to any image we found (even archive URLs)
    return mirrorImages[0] ?? inlineImages[0] ?? null;
  }
}

interface RssItem {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  description?: string;
  originalUrl?: string;
}

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
      originalUrl: readTag(block, "truth:originalUrl"),
    });
  }
  return items;
}

function readTag(block: string, tag: string): string | undefined {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i");
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

async function scrapePageImages(
  pageUrl: string,
  ctx: AdapterContext,
): Promise<string[]> {
  try {
    const html = await fetchText(pageUrl, { timeoutMs: 10_000, retries: 1 });
    return extractImageUrls(html);
  } catch (err) {
    ctx.logger.warn({ err: String(err), url: pageUrl }, "truth-social: failed to scrape page");
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

  // Also find og:image meta tags
  const ogRe = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  while ((m = ogRe.exec(html)) !== null) {
    if (m[1]) urls.push(m[1]);
  }

  return urls;
}

/**
 * Prefer Truth Social CDN URLs over the archive mirror. The archive
 * (truth-archive.us-iad-1.linodeobjects.com) is often unreachable from VPS
 * hosts, while static-assets-1.truthsocial.com works globally.
 */
function pickCdnImage(urls: string[]): string | null {
  const cdn = urls.find((u) => u.includes("static-assets") && u.includes("truthsocial"));
  if (cdn) {
    // Prefer original size over small thumbnail
    return cdn.replace("/small/", "/original/");
  }
  return null;
}

async function downloadImageAsBase64(url: string): Promise<{ base64: string; mediaType: string }> {
  // Use native https.get — Node's fetch (undici) gets 403'd by the CDN's
  // TLS fingerprinting, but the native http stack passes.
  const { default: https } = await import("https");
  const parsed = new URL(url);

  return new Promise((resolve, reject) => {
    const req = https.get(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Referer": "https://truthsocial.com/",
          "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${res.statusCode}`));
          res.resume();
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const contentType = res.headers["content-type"] ?? "image/jpeg";
          const mediaType = contentType.split(";")[0]!.trim();
          resolve({ base64: buf.toString("base64"), mediaType });
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(15_000, () => {
      req.destroy();
      reject(new Error("Image download timed out"));
    });
  });
}

async function describeImage(
  imageUrl: string,
  ctx: AdapterContext,
): Promise<string> {
  ctx.logger.info({ url: imageUrl }, "vision: describing image");
  const { base64, mediaType } = await downloadImageAsBase64(imageUrl);

  return ai().vision({
    imageBase64: base64,
    mediaType,
    prompt: "Read and transcribe ALL text in this image. If it's a screenshot of a statement, article, or social media post, extract the full text verbatim. If it's a chart or graph, describe what it shows including any numbers, labels, and trends. Be thorough — every word matters for market analysis.",
  });
}
