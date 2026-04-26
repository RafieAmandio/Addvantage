/**
 * Canonical indicator → affects[] / impact mapping for the ForexFactory feed.
 *
 * FF's feed title field is free-text and inconsistent across weeks (e.g.
 * "CPI m/m", "Core CPI m/m", "CPI y/y"), but the underlying indicator is a
 * closed set. We match on common title patterns and emit a stable `affects[]`
 * so the chart's `kind='macro'` markers actually filter to the right symbols
 * instead of relying on OpenAI to infer the same list per-event.
 *
 * Keep entries ordered most-specific first — the first match wins.
 *
 * `impact` here is OUR editorial take (closed `IMPACT_LEVELS` taxonomy), not
 * the FF-reported impact colour. FF's own impact string is preserved in
 * `metadata.impact` untouched.
 */
import type { Impact } from "@tradevantage/shared";

type CanonicalImpact = Impact;

interface IndicatorRule {
  match: RegExp;
  affects: string[];
  impact: CanonicalImpact;
}

export const FF_INDICATORS: IndicatorRule[] = [
  {
    match: /federal funds rate|FOMC statement|FOMC press conference|FOMC economic projections/i,
    affects: ["SPX", "DXY", "GOLD", "BTC"],
    impact: "high",
  },
  {
    match: /core CPI m\/m|^CPI m\/m|CPI y\/y|^CPI\b/i,
    affects: ["SPX", "DXY", "GOLD"],
    impact: "high",
  },
  {
    match: /Non-Farm Employment Change|\bNFP\b|Unemployment Rate|Average Hourly Earnings/i,
    affects: ["SPX", "DXY", "GOLD"],
    impact: "high",
  },
  {
    match: /Core PCE Price Index|PCE Price Index m\/m/i,
    affects: ["SPX", "DXY", "GOLD"],
    impact: "high",
  },
  {
    match: /Advance GDP|GDP q\/q|GDP m\/m/i,
    affects: ["SPX", "DXY", "GOLD"],
    impact: "high",
  },
  {
    match: /core PPI m\/m|^PPI m\/m|PPI y\/y/i,
    affects: ["SPX", "DXY"],
    impact: "medium",
  },
  {
    match: /Core Retail Sales m\/m|Retail Sales m\/m/i,
    affects: ["SPX", "DXY"],
    impact: "medium",
  },
];

export function matchIndicator(
  title: string
): { affects: string[]; impact: CanonicalImpact } | null {
  for (const row of FF_INDICATORS) {
    if (row.match.test(title)) {
      return { affects: row.affects, impact: row.impact };
    }
  }
  return null;
}
