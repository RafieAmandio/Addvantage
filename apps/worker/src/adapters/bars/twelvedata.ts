import { z } from "zod";
import { retry } from "../../lib/retry";
import { toIsoUtc } from "../../lib/date";
import { getNextApiKey } from "../../lib/api-key-pool";
import type { Bar, BarsAdapter, FetchBarsInput, Interval } from "./base";

/**
 * Twelve Data market-data adapter.
 *
 * Docs: https://twelvedata.com/docs#time-series
 *
 * Symbol mapping: passthrough — Twelve Data already accepts our canonical
 * symbols directly (`SPX`, `EUR/USD`, `BTC/USD`, `AAPL`).
 *
 * Interval mapping:
 *   1m → 1min, 5m → 5min, 1h → 1h, 1d → 1day
 *
 * Note: Twelve Data returns values newest-first; this adapter sorts ascending
 * before returning. Volume is omitted for FX / most indices — we coerce to null.
 */

const BASE = "https://api.twelvedata.com";

const INTERVAL_MAP: Record<Interval, string> = {
  "1m": "1min",
  "5m": "5min",
  "1h": "1h",
  "1d": "1day",
};

// Twelve Data returns all numeric values as strings. We keep the wire schema
// loose (strings) and convert to numbers in the mapper below.
const ValueSchema = z.object({
  datetime: z.string().min(1),
  open: z.string(),
  high: z.string(),
  low: z.string(),
  close: z.string(),
  volume: z.string().optional(),
});

const OkResponseSchema = z.object({
  status: z.literal("ok"),
  values: z.array(ValueSchema),
  meta: z.record(z.unknown()).optional(),
});

const ErrorResponseSchema = z.object({
  status: z.literal("error"),
  code: z.number().optional(),
  message: z.string(),
});

const ResponseSchema = z.union([OkResponseSchema, ErrorResponseSchema]);

function parseNumber(s: string): number {
  const n = Number(s);
  if (!Number.isFinite(n)) {
    throw new Error(`twelvedata: non-numeric value "${s}"`);
  }
  return n;
}

function formatDate(d: Date): string {
  // API wants "YYYY-MM-DD HH:MM:SS" UTC.
  const iso = d.toISOString(); // "YYYY-MM-DDTHH:MM:SS.sssZ"
  return iso.slice(0, 19).replace("T", " ");
}

export class TwelveDataAdapter implements BarsAdapter {
  readonly code = "twelvedata";

  async fetchBars(input: FetchBarsInput): Promise<Bar[]> {
    const apiKey = getNextApiKey();

    const params = new URLSearchParams({
      symbol: input.symbol,
      interval: INTERVAL_MAP[input.interval],
      start_date: formatDate(input.from),
      end_date: formatDate(input.to),
      apikey: apiKey,
      format: "JSON",
      timezone: "UTC",
    });

    const url = `${BASE}/time_series?${params.toString()}`;

    const raw = await retry(
      async () => {
        const res = await fetch(url);
        if (!res.ok) {
          // 429 / 5xx → throw so retry() backs off. 4xx (non-429) → also throw
          // but the body will usually come back as status:error JSON which we
          // handle below if the HTTP layer lets it through.
          throw new Error(
            `twelvedata: HTTP ${res.status} ${res.statusText}`
          );
        }
        return (await res.json()) as unknown;
      },
      {
        label: "twelvedata.time_series",
        attempts: 3,
      }
    );

    const parsed = ResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `twelvedata: unexpected response shape: ${parsed.error.message}`
      );
    }
    if (parsed.data.status === "error") {
      throw new Error(`twelvedata: ${parsed.data.message}`);
    }

    const bars: Bar[] = parsed.data.values.map((v) => ({
      ts: toIsoUtc(v.datetime),
      open: parseNumber(v.open),
      high: parseNumber(v.high),
      low: parseNumber(v.low),
      close: parseNumber(v.close),
      volume:
        v.volume !== undefined && v.volume !== ""
          ? parseNumber(v.volume)
          : null,
    }));

    // Twelve Data returns newest-first; callers expect chronological order.
    bars.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
    return bars;
  }
}

export const twelveDataAdapter = new TwelveDataAdapter();
