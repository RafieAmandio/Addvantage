import { config } from "../lib/config";
import { fetchJson } from "../lib/http";
import type { AdapterContext, Candidate, SourceAdapter } from "./base";

/**
 * FRED adapter — polls a whitelist of high-signal series via the official API.
 * When a new observation appears for a series, emits a Candidate describing the
 * change in plain English; the pipeline then rephrases it through OpenAI.
 *
 * Docs: https://fred.stlouisfed.org/docs/api/fred/
 */

interface FredObservation {
  date: string;
  value: string;
}

interface FredObservationsResponse {
  observations: FredObservation[];
}

/**
 * Curated series we care about. Each entry is a (series_id, short_label).
 * Add sparingly — each series is one API call per poll.
 */
const SERIES: Array<{ id: string; label: string }> = [
  { id: "CPIAUCSL", label: "CPI (US, Urban, All Items, SA)" },
  { id: "UNRATE", label: "US Unemployment Rate" },
  { id: "FEDFUNDS", label: "Fed Funds Effective Rate" },
  { id: "DGS10", label: "10Y Treasury Yield" },
  { id: "DGS2", label: "2Y Treasury Yield" },
  { id: "T10Y2Y", label: "10Y–2Y Spread" },
  { id: "DCOILWTICO", label: "WTI Crude Oil Spot" },
  { id: "DEXCHUS", label: "CNY / USD Exchange Rate" },
  { id: "VIXCLS", label: "CBOE VIX" },
];

const BASE = "https://api.stlouisfed.org/fred";

export class FredAdapter implements SourceAdapter {
  readonly code = "FRED";
  readonly name = "FRED — Federal Reserve Economic Data";

  async fetch(ctx: AdapterContext): Promise<Candidate[]> {
    if (!config.FRED_API_KEY) {
      ctx.logger.warn("FRED_API_KEY not set — skipping FRED adapter");
      return [];
    }

    const out: Candidate[] = [];
    for (const s of SERIES) {
      try {
        const obs = await fetchJson<FredObservationsResponse>(
          `${BASE}/series/observations?series_id=${s.id}&api_key=${config.FRED_API_KEY}&file_type=json&sort_order=desc&limit=2`
        );
        const [latest, prev] = obs.observations;
        if (!latest || latest.value === ".") continue;

        const rawText = prev && prev.value !== "."
          ? `${s.label} (${s.id}): latest observation ${latest.value} for ${latest.date}, previous ${prev.value} for ${prev.date}.`
          : `${s.label} (${s.id}): latest observation ${latest.value} for ${latest.date}.`;

        out.push({
          externalId: `${s.id}:${latest.date}`,
          sourceUrl: `https://fred.stlouisfed.org/series/${s.id}`,
          rawText,
          meta: {
            series_id: s.id,
            series_label: s.label,
            latest_date: latest.date,
            latest_value: latest.value,
            previous_value: prev?.value ?? "",
          },
          occurredAt: new Date(`${latest.date}T00:00:00Z`).toISOString(),
        });
      } catch (err) {
        ctx.logger.error({ series: s.id, err: String(err) }, "fred fetch failed");
      }
    }
    return out;
  }

  /** Exposed for admin page display. */
  static meta() {
    return { seriesCount: SERIES.length };
  }
}
