import type { Metadata } from "next";
import { FOREX_PAIRS } from "@tradevantage/shared";
import { apiGet } from "@/lib/api/client-server";
import { isMockMode } from "@/lib/config/public";
import { getProfile } from "@/lib/auth/session";
import { listBars } from "@/features/chart/queries/bars";
import { toChartBars } from "@/features/chart/lib/bars";
import { generateMockBars } from "@/features/chart/mock";
import { listPublishedPlans } from "@/features/plan/queries/plans";
import { dbPlanToTradingPlan } from "@/features/plan/lib/adapt";
import { listBulletins } from "@/features/bulletin/queries/bulletins";
import { listTimelineEvents } from "@/features/timeline/queries/timeline";
import { timelineEventToCalendarEvent } from "@/features/calendar/lib/fromTimeline";
import type { NewsListItem } from "@/features/news/queries/news";
import type { AtrPair } from "@/features/atr/types";
import type { CalendarEvent } from "@/features/calendar/types";
import type { Bar } from "@/features/chart/components/PriceChart";
import InstrumentClient, { type RsiDetail } from "./InstrumentClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const flat = (s: string) => s.replace("/", "").toUpperCase();
// Plans name a few instruments by their futures or brand ticker.
const ALIAS: Record<string, string> = { GOLD: "XAUUSD", "GC1!": "XAUUSD", SILVER: "XAGUSD", "SI1!": "XAGUSD" };
const same = (a: string, b: string) => (ALIAS[flat(a)] ?? flat(a)) === (ALIAS[flat(b)] ?? flat(b));

const REGION: Record<string, CalendarEvent["region"]> = { USD: "US", EUR: "EU", GBP: "UK", JPY: "JP", CNY: "CN", IDR: "ID" };

/** Group hourly bars into UTC days, for mock mode and when 1d bars are missing. */
function toDaily(hourly: Bar[]): Bar[] {
  const days = new Map<string, Bar>();
  for (const b of hourly) {
    const k = b.time.slice(0, 10);
    const d = days.get(k);
    if (!d) days.set(k, { ...b, time: `${k}T00:00:00.000Z` });
    else Object.assign(d, { high: Math.max(d.high, b.high), low: Math.min(d.low, b.low), close: b.close });
  }
  return [...days.values()];
}

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  return { title: flat(decodeURIComponent((await params).symbol)) };
}

export default async function InstrumentPage({ params }: { params: Promise<{ symbol: string }> }) {
  const raw = decodeURIComponent((await params).symbol);
  const pair = FOREX_PAIRS.find((p) => flat(p.symbol) === flat(raw));
  const canonical = pair?.symbol ?? raw.toUpperCase();
  const sym = flat(canonical);
  const enc = encodeURIComponent(canonical);
  const now = Date.now();

  const profile = await getProfile();
  const canSeeBulletin = !!profile && (profile.tier === "vip" || profile.isAdmin);

  const [rsi, atr, hourlyRows, dailyRows, news, plans, bulletins, macro] = await Promise.all([
    apiGet<RsiDetail>(`/rsi/detail/${enc}`).catch(() => null),
    apiGet<AtrPair & { label: string }>(`/atr/detail/${enc}`).catch(() => null),
    listBars({ symbol: canonical, interval: "1h", from: new Date(now - 14 * 86_400_000), to: new Date(now) }),
    listBars({ symbol: canonical, interval: "1d", from: new Date(now - 180 * 86_400_000), to: new Date(now) }),
    apiGet<NewsListItem[]>(`/news?affects=${encodeURIComponent(sym)}&limit=50`).catch(() => [] as NewsListItem[]),
    listPublishedPlans({ limit: 20 }),
    canSeeBulletin ? listBulletins() : Promise.resolve([]),
    listTimelineEvents({
      kinds: ["macro"],
      from: new Date(now - 2 * 3600_000).toISOString(),
      to: new Date(now + 72 * 3600_000).toISOString(),
      limit: 200,
    }).catch(() => []),
  ]);

  let hourly = toChartBars(hourlyRows);
  let daily = toChartBars(dailyRows);
  if (hourly.length === 0 && isMockMode()) hourly = generateMockBars(sym, { hours: 14 * 24, basePrice: atr?.price ?? undefined });
  if (daily.length === 0) daily = toDaily(hourly);

  const setups = plans
    .filter((p) => p.status === "published")
    .map(dbPlanToTradingPlan)
    .flatMap((p) => p.setups.filter((s) => same(s.instrument, canonical)).map((s) => ({ ...s, planDate: p.date, horizon: p.horizon })));

  // Metals and oil trade on US data; FX pairs on both legs.
  const legs = pair?.group === "commodity" ? ["USD"] : [canonical.slice(0, 3), canonical.slice(-3)];
  const regions = new Set(legs.map((c) => REGION[c]).filter(Boolean));
  const calendar = macro
    .map(timelineEventToCalendarEvent)
    .filter((e) => e.impact !== "low" && regions.has(e.region) && new Date(e.ts).getTime() >= now - 2 * 3600_000)
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .slice(0, 6);

  return (
    <InstrumentClient
      symbol={sym}
      label={pair?.label ?? rsi?.label ?? atr?.label ?? sym}
      group={pair?.group ?? rsi?.group ?? "other"}
      rsi={rsi}
      atr={atr}
      hourly={hourly}
      daily={daily}
      news={news}
      setups={setups}
      bulletin={bulletins.find((b) => same(b.symbol, canonical)) ?? null}
      calendar={calendar}
    />
  );
}
