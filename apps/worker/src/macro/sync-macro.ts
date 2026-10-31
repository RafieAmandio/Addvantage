import { prisma, Prisma } from "@tradevantage/db";
import { logger } from "../lib/logger";
import { retry } from "../lib/retry";

/**
 * Macro snapshot for the forex desk: policy rates (BIS), next-decision odds
 * (Polymarket), 10Y yields and US curve (FRED), risk gauges (Yahoo VIX/MOVE,
 * FRED high-yield spread). All keyless. Each step starts from the last good
 * snapshot, so one blocked source never blanks the page.
 */

export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF"] as const;
type Ccy = (typeof CURRENCIES)[number];

const BANKS: Record<Ccy, { bank: string; bis: string; fred10y: string; poly: [string, RegExp] }> = {
  USD: { bank: "Fed", bis: "US", fred10y: "IRLTLT01USM156N", poly: ["fed decision", /^Fed Decision in/i] },
  EUR: { bank: "ECB", bis: "XM", fred10y: "IRLTLT01DEM156N", poly: ["ecb interest rates", /^ECB Interest Rates:/i] },
  GBP: { bank: "BoE", bis: "GB", fred10y: "IRLTLT01GBM156N", poly: ["bank of england decision", /^Bank of England decision/i] },
  JPY: { bank: "BoJ", bis: "JP", fred10y: "IRLTLT01JPM156N", poly: ["bank of japan decision", /^Bank of Japan Decision/i] },
  AUD: { bank: "RBA", bis: "AU", fred10y: "IRLTLT01AUM156N", poly: ["reserve bank of australia decision", /^Reserve Bank of Australia Decision/i] },
  NZD: { bank: "RBNZ", bis: "NZ", fred10y: "IRLTLT01NZM156N", poly: ["reserve bank of new zealand decision", /^Reserve Bank of New Zealand decision/i] },
  CAD: { bank: "BoC", bis: "CA", fred10y: "IRLTLT01CAM156N", poly: ["bank of canada decision", /^Bank of Canada Decision/i] },
  CHF: { bank: "SNB", bis: "CH", fred10y: "IRLTLT01CHM156N", poly: ["swiss national bank decision", /^Swiss National Bank decision/i] },
};

export interface RateOdds {
  title: string;
  meetingDate: string;
  outcomes: { label: string; p: number }[];
  volume: number;
  url: string;
}

export interface Gauge {
  v: number;
  change: number | null;
  asOf: string;
  spark: number[];
}

export interface MacroData {
  banks: Partial<Record<Ccy, { bank: string; rate: number; asOf: string; lastChange: number | null; lastChangeDate: string | null; odds?: RateOdds }>>;
  yields10y?: { months: string[]; series: Partial<Record<Ccy, (number | null)[]>> };
  usCurve?: { y2: number; y10: number; asOf: string };
  risk: { vix?: Gauge; move?: Gauge; ig?: Gauge; hy?: Gauge };
}

const round = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

async function getText(url: string): Promise<string> {
  return retry(
    async () => {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 TradeVantage" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return res.text();
    },
    { label: "macro.fetch", attempts: 3 },
  );
}
const getJson = async <T>(url: string) => JSON.parse(await getText(url)) as T;

/** FRED keyless CSV → [{date, v}] with blanks ("." ) dropped. */
async function fred(id: string) {
  const csv = await getText(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`);
  return csv
    .trim()
    .split("\n")
    .slice(1)
    .map((l) => l.split(","))
    .filter(([, v]) => v && v !== "." && Number.isFinite(Number(v)))
    .map(([date, v]) => ({ date: date!, v: Number(v) }));
}

/** BIS WS_CBPOL daily policy rate: latest value plus the last move and its date. */
async function policyRate(country: string) {
  const since = new Date(Date.now() - 3 * 365 * 86_400_000).toISOString().slice(0, 10);
  const csv = await getText(`https://stats.bis.org/api/v2/data/dataflow/BIS/WS_CBPOL/1.0/D.${country}?startPeriod=${since}&format=csv`);
  const rows = [...csv.matchAll(/,(\d{4}-\d{2}-\d{2}),(-?[\d.]+),/g)].map((m) => ({ date: m[1]!, v: Number(m[2]) }));
  const last = rows.at(-1);
  if (!last) throw new Error(`BIS ${country}: no rows`);
  let i = rows.length - 1;
  while (i > 0 && rows[i - 1]!.v === last.v) i--;
  const prev = i > 0 ? rows[i - 1]! : null;
  return {
    rate: last.v,
    asOf: last.date,
    lastChange: prev ? round(last.v - prev.v) : null,
    lastChangeDate: prev ? rows[i]!.date : null,
  };
}

/** Nearest open Polymarket decision event for a bank; outcomes sorted by probability. */
async function rateOdds([q, re]: [string, RegExp]): Promise<RateOdds | undefined> {
  type Ev = { title: string; slug: string; endDate: string; active: boolean; closed: boolean; volume?: string; markets?: { active: boolean; closed: boolean; groupItemTitle?: string; question: string; outcomePrices: string }[] };
  const search = await getJson<{ events?: Ev[] }>(`https://gamma-api.polymarket.com/public-search?q=${encodeURIComponent(q)}&events_status=active&limit_per_type=20`);
  const ev = (search.events ?? [])
    .filter((e) => re.test(e.title) && e.active && !e.closed && Date.parse(e.endDate) > Date.now())
    .sort((a, b) => a.endDate.localeCompare(b.endDate))[0];
  if (!ev) return undefined;
  const [full] = await getJson<Ev[]>(`https://gamma-api.polymarket.com/events?slug=${ev.slug}`);
  if (!full?.markets) return undefined;
  const outcomes = full.markets
    .filter((m) => m.active && !m.closed)
    .map((m) => ({ label: m.groupItemTitle || m.question, p: round(Number((JSON.parse(m.outcomePrices) as string[])[0])) }))
    .filter((o) => Number.isFinite(o.p))
    .sort((a, b) => b.p - a.p);
  if (outcomes.length === 0) return undefined;
  return { title: full.title, meetingDate: full.endDate, outcomes, volume: Math.round(Number(full.volume) || 0), url: `https://polymarket.com/event/${full.slug}` };
}

/** Yahoo daily closes for an index (^VIX, ^MOVE): last value, day change %, 30-close spark. */
async function yahoo(symbol: string): Promise<Gauge> {
  type Chart = { chart: { result?: { timestamp: number[]; indicators: { quote: { close: (number | null)[] }[] } }[] } };
  const d = await getJson<Chart>(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=3mo&interval=1d`);
  const r = d.chart.result?.[0];
  if (!r) throw new Error(`yahoo ${symbol}: no result`);
  const pts = r.timestamp.map((t, i) => ({ t, v: r.indicators.quote[0]!.close[i] })).filter((p): p is { t: number; v: number } => p.v != null);
  const last = pts.at(-1)!;
  const prev = pts.at(-2);
  return {
    v: round(last.v, 2),
    change: prev ? round(((last.v - prev.v) / prev.v) * 100, 2) : null,
    asOf: new Date(last.t * 1000).toISOString().slice(0, 10),
    spark: pts.slice(-30).map((p) => round(p.v, 2)),
  };
}

/** Fetch every source on top of `last` (the previous snapshot). No DB access. */
export async function fetchMacro(last?: MacroData): Promise<{ data: MacroData; failures: number }> {
  const out: MacroData = { ...last, banks: { ...last?.banks }, risk: { ...last?.risk } };
  let failures = 0;
  const step = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err) {
      failures++;
      logger.warn({ step: name, err: String(err).slice(0, 160) }, "macro-sync: step failed");
    }
  };

  for (const ccy of CURRENCIES) {
    const b = BANKS[ccy];
    await step(`policy ${ccy}`, async () => {
      out.banks[ccy] = { ...out.banks[ccy], bank: b.bank, ...(await policyRate(b.bis)) };
    });
    await step(`odds ${ccy}`, async () => {
      const odds = await rateOdds(b.poly);
      if (out.banks[ccy]) out.banks[ccy]!.odds = odds;
    });
  }

  await step("10y yields", async () => {
    const series = Object.fromEntries(await Promise.all(CURRENCIES.map(async (c) => [c, await fred(BANKS[c].fred10y)] as const)));
    const months = [...new Set(Object.values(series).flat().map((x) => x.date))].sort().slice(-13);
    out.yields10y = {
      months: months.map((m) => m.slice(0, 7)),
      series: Object.fromEntries(CURRENCIES.map((c) => [c, months.map((m) => series[c]!.find((x) => x.date === m)?.v ?? null)])),
    };
  });

  await step("us curve", async () => {
    const [y2, y10] = await Promise.all([fred("DGS2"), fred("DGS10")]);
    out.usCurve = { y2: y2.at(-1)!.v, y10: y10.at(-1)!.v, asOf: y10.at(-1)!.date };
  });

  await step("vix", async () => {
    out.risk.vix = await yahoo("^VIX");
  });
  await step("move", async () => {
    out.risk.move = await yahoo("^MOVE");
  });
  // ICE BofA option-adjusted spreads, % points: investment grade and high yield, change over 1 month.
  for (const [key, id] of [["ig", "BAMLC0A0CM"], ["hy", "BAMLH0A0HYM2"]] as const) {
    await step(`${key} spread`, async () => {
      const rows = await fred(id);
      const last = rows.at(-1)!;
      const monthAgo = [...rows].reverse().find((x) => Date.parse(x.date) <= Date.parse(last.date) - 30 * 86_400_000);
      out.risk[key] = { v: last.v, change: monthAgo ? round(last.v - monthAgo.v, 2) : null, asOf: last.date, spark: rows.slice(-30).map((x) => x.v) };
    });
  }

  return { data: out, failures };
}

export async function syncMacro(): Promise<void> {
  const prev = await prisma.macroSnapshot.findUnique({ where: { id: 1 } });
  const { data: out, failures } = await fetchMacro((prev?.data as unknown as MacroData | null) ?? undefined);
  const data = out as unknown as Prisma.InputJsonValue;
  const syncedAt = new Date();
  await prisma.macroSnapshot.upsert({ where: { id: 1 }, create: { id: 1, data, syncedAt }, update: { data, syncedAt } });
  logger.info({ banks: Object.keys(out.banks).length, failures }, "macro-sync: done");
}
