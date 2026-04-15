/**
 * One-shot DOM inspector — fetches a URL and prints distinct CSS signatures
 * so we can pick good selectors for a new adapter.
 *
 * Usage:
 *   pnpm exec tsx src/cli/inspect.ts https://yardeni.com/
 */
import * as cheerio from "cheerio";
import { fetchText } from "../lib/http";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("usage: inspect <url>");
    process.exit(1);
  }
  const html = await fetchText(url);
  console.log(`length: ${html.length} bytes`);
  const $ = cheerio.load(html);
  const title = $("title").text().trim();
  console.log(`title: ${title}`);

  const anchors: Array<{ href: string; text: string }> = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (!text || text.length < 4) return;
    anchors.push({ href, text });
  });

  console.log(`\nanchors with text (${anchors.length}):`);
  for (const a of anchors.slice(0, 40)) {
    const tlen = a.text.length;
    const display = a.text.length > 80 ? a.text.slice(0, 80) + "…" : a.text;
    console.log(`  [${String(tlen).padStart(3)}] ${display}`);
    console.log(`       → ${a.href}`);
  }
}

void main();
