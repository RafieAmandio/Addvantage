import { test } from "node:test";
import assert from "node:assert/strict";
import { matchRelease, parseRss } from "./actuals";

// Same shape as the live feed: the description is an HTML-escaped table.
const item = (slug: string, title: string, date: string, [prev, cons, act]: string[]) => `
<item>
  <title>${title}</title>
  <link>https://www.myfxbook.com/forex-economic-calendar/${slug}/x</link>
  <pubDate>${date}</pubDate>
  <description>&#60;table&#62;&#60;tr&#62;&#60;th&#62;Time left&#60;/th&#62;&#60;/tr&#62;&#60;tr&#62;
    &#60;td&#62;-3046 seconds&#60;/td&#62;&#60;td&#62;&#60;span class=&#34;sprite-low-impact&#34;&#62;&#60;/span&#62;&#60;/td&#62;
    &#60;td&#62; ${prev} &#60;/td&#62;&#60;td&#62; ${cons} &#60;/td&#62;&#60;td&#62; ${act} &#60;/td&#62;&#60;/tr&#62;&#60;/table&#62;</description>
</item>`;

const at = Date.parse("2026-11-17T13:30:00Z");
const rss = `<rss><channel>
${item("new-zealand", "New Zealand Business Inflation Expectations", "Tue, 17 Nov 2026 02:00 GMT", ["2.34%", "2.4%", "2.36%"])}
${item("united-states", "United States Retail Sales MoM", "Tue, 17 Nov 2026 13:30 GMT", ["0.8%", "0.2%", "0.3%"])}
${item("united-states", "United States Retail Sales Ex Autos MoM", "Tue, 17 Nov 2026 13:30 GMT", ["0.9%", "0.4%", "0.5%"])}
${item("united-states", "United States Retail Sales Control Group MoM", "Tue, 17 Nov 2026 13:30 GMT", ["0.1%", "0.4%", "0.6%"])}
${item("united-states", "United States Import Prices MoM", "Tue, 17 Nov 2026 13:30 GMT", ["1.1%", "0.7%", ""])}
${item("japan", "Japan Balance of Trade", "Tue, 17 Nov 2026 13:30 GMT", ["¥-536.6B", "¥-956.0B", "¥-801.2B"])}
${item("germany", "Germany ZEW Economic Sentiment Index", "Tue, 17 Nov 2026 13:30 GMT", ["28.1", "29.0", "30.2"])}
${item("euro-area", "Euro Area ZEW Economic Sentiment Index", "Tue, 17 Nov 2026 13:30 GMT", ["18.5", "18.3", "19.0"])}
${item("singapore", "Singapore MAS 4-Week Bill Auction", "Tue, 17 Nov 2026 05:00 GMT", ["1.76%", "", "1.8%"])}
</channel></rss>`;

test("parseRss reads country, minute, name and the three figures", () => {
  const r = parseRss(rss);
  assert.equal(r.length, 8); // Singapore is not a tracked country
  assert.deepEqual(r[0], {
    country: "NZ", at: Date.parse("2026-11-17T02:00:00Z"), name: "Business Inflation Expectations",
    previous: "2.34%", consensus: "2.4%", actual: "2.36%",
  });
});

test("matchRelease picks the row the previous print agrees with", () => {
  const r = parseRss(rss);
  const ev = (name: string, previous: string, forecast: string) => ({ country: "US", at, name, previous, forecast });
  assert.equal(matchRelease(ev("Retail Sales m/m", "0.8%", "0.1%"), r)?.actual, "0.3%");
  assert.equal(matchRelease(ev("Core Retail Sales m/m", "0.9%", "0.4%"), r)?.actual, "0.5%");
  assert.equal(
    matchRelease({ country: "NZ", at: Date.parse("2026-11-17T02:00:00Z"), name: "Inflation Expectations q/q", previous: "2.34%", forecast: null }, r)?.actual,
    "2.36%",
  );
  // Not released yet, wrong minute, unrelated name: no match.
  assert.equal(matchRelease(ev("Import Prices m/m", "1.1%", "0.7%"), r), null);
  assert.equal(matchRelease({ ...ev("Retail Sales m/m", "0.8%", "0.1%"), at: at + 60_000 }, r), null);
  assert.equal(matchRelease(ev("Building Permits", "1.3M", "1.4M"), r), null);
  // Euro members keep their adjective; a far-off previous means another series.
  const eu = (name: string, previous: string) => ({ country: "EU", at, name, previous, forecast: null });
  assert.equal(matchRelease(eu("German ZEW Economic Sentiment", "28.1"), r)?.actual, "30.2");
  assert.equal(matchRelease(eu("ZEW Economic Sentiment", "18.5"), r)?.actual, "19.0");
  assert.equal(matchRelease({ country: "JP", at, name: "Trade Balance", previous: "-0.70T", forecast: "-0.90T" }, r), null);
});
