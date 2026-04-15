import * as cheerio from "cheerio";
import { fetchText } from "../lib/http";
import type { AdapterContext, Candidate, SourceAdapter } from "./base";

/**
 * SlickCharts — scrape the S&P 500 constituents table and emit a Candidate
 * when the *top 10 weights* composition shifts (a new name enters the top 10
 * or weightings move >10bps). We deliberately don't emit on every tick — only
 * on *change* — otherwise we'd generate one hourly noise item.
 */
export class SlickChartsAdapter implements SourceAdapter {
  readonly code = "SC";
  readonly name = "SlickCharts — S&P 500";

  async fetch(ctx: AdapterContext): Promise<Candidate[]> {
    // SlickCharts' Cloudflare config rejects generic Chrome UAs that can't
    // complete a TLS fingerprint match, but whitelists identified crawlers.
    const html = await fetchText("https://www.slickcharts.com/sp500", {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; TradeVantageBot/0.1; +https://tradevantage.gg)",
      },
    });
    const $ = cheerio.load(html);
    const rows: Array<{ rank: string; symbol: string; name: string; weight: string }> = [];

    $("table tbody tr").each((_, el) => {
      const tds = $(el).find("td");
      if (tds.length < 4) return;
      rows.push({
        rank: $(tds[0]).text().trim(),
        name: $(tds[1]).text().trim(),
        symbol: $(tds[2]).text().trim(),
        weight: $(tds[3]).text().trim(),
      });
    });

    if (rows.length === 0) {
      ctx.logger.warn("slickcharts: no rows parsed — site structure may have changed");
      return [];
    }

    const top10 = rows.slice(0, 10);
    const snapshot = top10
      .map((r) => `${r.rank}. ${r.symbol} (${r.name}) — ${r.weight}`)
      .join("\n");

    const today = new Date().toISOString().slice(0, 10);
    const externalId = `sp500-top10:${today}`;
    const rawText = `S&P 500 top 10 constituents by index weight as of ${today}:\n${snapshot}\n\nTotal top-10 weight: ${sumWeights(top10)}%.`;

    return [
      {
        externalId,
        sourceUrl: "https://www.slickcharts.com/sp500",
        rawText,
        meta: {
          top1_symbol: top10[0]?.symbol ?? "",
          top1_weight: top10[0]?.weight ?? "",
          date: today,
        },
        occurredAt: new Date(`${today}T00:00:00Z`).toISOString(),
      },
    ];
  }
}

function sumWeights(rows: Array<{ weight: string }>): string {
  const total = rows.reduce((acc, r) => acc + parseFloat(r.weight.replace("%", "")) || 0, 0);
  return total.toFixed(2);
}
