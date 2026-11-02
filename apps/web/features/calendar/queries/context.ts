import { listBars } from "@/features/chart/queries/bars";
import { listTimelineEvents } from "@/features/timeline/queries/timeline";
import type { TimelineEvent } from "@/features/timeline/types";
import { eventLabel, relatedSymbols, seriesKey } from "@/features/calendar/lib/econ";

if (typeof window !== "undefined") {
  throw new Error("features/calendar/queries/context.ts is server-only");
}

export type Release = { ts: string; actual: string; forecast?: string };
export type MarketQuote = { symbol: string; price: number; change: number; spark: number[] };
export type Reaction = {
  symbol: string;
  at: string;
  /** "this" when the event itself has printed, "last" for the previous release of the series. */
  which: "this" | "last";
  base: number;
  after1h: number;
  after4h: number | null;
  high: number;
  low: number;
  closes: { ts: string; close: number }[];
};

const H = 3600_000;
const D = 24 * H;
const str = (v: unknown) => (v === undefined || v === null || v === "" ? undefined : String(v));

/** Past prints of the same series. Demo fixtures carry them; live finds them on the timeline. */
async function history(event: TimelineEvent, name: string): Promise<Release[]> {
  const meta = (event.metadata ?? {}) as Record<string, unknown>;
  if (Array.isArray(meta.history)) return meta.history as Release[];
  const key = seriesKey(name);
  const t = new Date(event.occurredAt).getTime();
  // ponytail: one capped timeline read per region; a series endpoint would see further back.
  const rows = await listTimelineEvents({
    kinds: ["macro"],
    symbols: event.symbols.slice(0, 1),
    from: new Date(t - 400 * D).toISOString(),
    to: new Date(t - 60_000).toISOString(),
    limit: 500,
  });
  return rows
    .filter((r) => r.id !== event.id && seriesKey(eventLabel(r.title, r.symbols[0] ?? "").name) === key)
    .flatMap((r) => {
      const m = (r.metadata ?? {}) as Record<string, unknown>;
      const actual = str(m.actual);
      return actual ? [{ ts: r.occurredAt, actual, forecast: str(m.forecast) ?? str(m.consensus) }] : [];
    })
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .slice(-8);
}

const closes = (bars: Awaited<ReturnType<typeof listBars>>) =>
  bars.flatMap((b) => (b.close !== null && b.open !== null ? [{ ts: b.ts, open: b.open, close: b.close, high: b.high ?? b.close, low: b.low ?? b.close }] : []));

async function quote(symbol: string): Promise<MarketQuote | null> {
  const now = Date.now();
  const c = closes(await listBars({ symbol, interval: "1h", from: new Date(now - 4 * D), to: new Date(now) }));
  const last = c.at(-1);
  if (!last) return null;
  const dayAgo = [...c].reverse().find((x) => new Date(x.ts).getTime() <= new Date(last.ts).getTime() - D) ?? c[0]!;
  return { symbol, price: last.close, change: (last.close / dayAgo.close - 1) * 100, spark: c.slice(-24).map((x) => x.close) };
}

/** Hourly move on the main pair around a release: open of the release hour to one and four hours on. */
async function reaction(symbol: string, at: string, which: Reaction["which"]): Promise<Reaction | null> {
  const t = new Date(at).getTime();
  if (t > Date.now() - H) return null;
  const c = closes(await listBars({ symbol, interval: "1h", from: new Date(t - 8 * H), to: new Date(t + 10 * H) })).filter(
    (x) => Math.abs(new Date(x.ts).getTime() - t) <= 10 * H,
  );
  const i = c.findLastIndex((x) => new Date(x.ts).getTime() <= t);
  // The release hour has to be in the data, not a weekend gap.
  if (i < 0 || t - new Date(c[i]!.ts).getTime() >= H) return null;
  const win = c.slice(i, i + 4);
  return {
    symbol,
    at,
    which,
    base: c[i]!.open,
    after1h: c[i]!.close,
    after4h: win.length === 4 ? win[3]!.close : null,
    high: Math.max(...win.map((x) => x.high)),
    low: Math.min(...win.map((x) => x.low)),
    closes: c.slice(Math.max(0, i - 6), i + 8).map(({ ts, close }) => ({ ts, close })),
  };
}

export async function eventContext(event: TimelineEvent) {
  const { cur, name } = eventLabel(event.title, event.symbols[0] ?? "");
  const symbols = relatedSymbols(cur);
  const meta = (event.metadata ?? {}) as Record<string, unknown>;
  const [past, quotes] = await Promise.all([
    history(event, name),
    Promise.all(symbols.slice(0, 4).map((s) => quote(s).catch(() => null))),
  ]);
  const released = !!str(meta.actual) && new Date(event.occurredAt).getTime() <= Date.now();
  const at = released ? event.occurredAt : past.at(-1)?.ts;
  const react = at ? await reaction(symbols[0]!, at, released ? "this" : "last").catch(() => null) : null;
  return { history: past, markets: quotes.filter((q): q is MarketQuote => q !== null), reaction: react };
}
