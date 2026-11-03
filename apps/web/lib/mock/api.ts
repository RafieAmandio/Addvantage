// Mock mode only: answers the backend paths that queries still call in demo, so pages
// that hit the API directly get data instead of a refused connection. Server apiGet calls
// this directly; browser apiGet reaches it through app/api/demo/[...path]/route.ts.
// Paths not handled here throw, so callers fall back exactly as they do on an API error.
import { FOREX_PAIRS, HASHTAGS, SOURCES } from "@tradevantage/shared";
import { listBars } from "@/features/chart/queries/bars";
import { mockApprovedNews, mockBulletins, mockPublishedPlans, mockTimelineEvents } from "@/lib/mock/fixtures";
import { mockChannelPosts, mockChannelThreads } from "@/features/channel/mock";
import { primers } from "@/features/education/mock";
import { demoAtrScanner, demoGapScanner, demoMarket } from "@/lib/mock/market";
import type { TimelineKind } from "@/features/timeline/types";
import { demoBlackFriday } from "@/lib/mock/black-friday";

export class DemoApiMiss extends Error {}

const flat = (s: string) => s.replace("/", "").toUpperCase();
const ALIAS: Record<string, string> = { GOLD: "XAUUSD", XAU: "XAUUSD", SILVER: "XAGUSD", OIL: "WTIUSD", WTI: "WTIUSD", CL: "WTIUSD" };
const canon = (s: string) => ALIAS[flat(s)] ?? flat(s);

const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();
const H = 3600_000;
const D = 24 * H;

const CONSULT_ID = "6f1c2a4e-8b7d-4c3a-9e21-5d0f7b3a1c90";
const CONSULT: { m: number; role: "user" | "admin"; content: string }[] = [
  { m: 26 * 60, role: "user", content: "Took a gold long at 3,948 on the London retest, stop 3,931. It hit the stop by a few dollars and then ran 40 dollars in my direction. Was the stop wrong or the entry?" },
  { m: 25 * 60, role: "admin", content: "The entry was fine, the stop was inside the noise. On that day ATR was about 72 dollars, so a 17 dollar stop is under a quarter of the daily range. Either put it below the 3,921 structure low and cut size to keep the same risk, or wait for the 1H close above 3,952 and use a tighter stop from there." },
  { m: 24 * 60, role: "user", content: "If I put it under 3,921 my size drops to about 0.3 lots. Feels too small to matter." },
  { m: 23 * 60, role: "admin", content: "That feeling is the problem, not the size. Your rule is 1.5 percent per trade. The size that fits the right stop is the size. Two good trades at the right size beat one big trade that gets stopped by noise." },
  { m: 3 * 60, role: "user", content: "Gold is now under 3,880 after Friday's range. I want to short the retest of 3,912. Is that against the weekly bias?" },
  { m: 2 * 60, role: "admin", content: "Weekly is still up above 3,790, daily turned down on Friday. A short at 3,912 is a counter trend trade on the weekly, so treat it as a day trade: half size, target 3,872 first, do not hold it into the US session data." },
];

function consultRows() {
  return CONSULT.map((c, i) => ({
    id: `6f1c2a4e-8b7d-4c3a-9e21-${String(i + 1).padStart(12, "0")}`,
    sessionId: CONSULT_ID,
    role: c.role,
    content: c.content,
    metadata: null,
    createdAt: iso(c.m * 60_000),
  }));
}

async function rsiRows() {
  return (await demoMarket()).filter((s) => s.price !== null);
}

async function get(path: string): Promise<unknown> {
  const url = new URL(path, "http://demo");
  const p = url.pathname.replace(/\/+$/, "");
  const q = url.searchParams;
  let m: RegExpMatchArray | null;

  if (p === "/users/me")
    return { id: "demo-operator", email: "demo@tradevantage.local", handle: "demo-operator", isAdmin: true, tier: "vip", signedLiability: true, allowMention: true };
  if (p === "/referral/partners") return [];
  if (p === "/sources")
    return SOURCES.map((x, i) => ({ code: x.code, name: x.name, url: x.url, enabled: true, pollMinutes: x.pollMinutes, lastPolledAt: iso((i % 7) * 4 * 60_000 + 60_000), lastSuccessAt: iso((i % 7) * 4 * 60_000 + 60_000), lastError: null }));

  if (p === "/atr/scanner") return demoAtrScanner();
  if ((m = p.match(/^\/atr\/detail\/(.+)$/))) {
    const sym = decodeURIComponent(m[1]!);
    const pair = (await demoAtrScanner()).pairs.find((x) => x.symbol === sym);
    if (!pair) throw new DemoApiMiss(p);
    return { ...pair, label: FOREX_PAIRS.find((x) => x.symbol === sym)?.label ?? sym };
  }
  if (p === "/gap-screener/scanner") return demoGapScanner();

  if (p === "/rsi/heatmap") {
    const rows = await rsiRows();
    const interval = q.get("interval") ?? "1h";
    const updatedAt = new Date().toISOString();
    if (interval === "all") {
      return {
        interval: "all",
        updatedAt,
        pairs: rows.map((s) => ({
          symbol: s.symbol,
          price: s.price,
          group: s.group,
          tier: s.tier,
          rsi1h: s.rsi["1h"]?.rsi ?? null,
          rsi4h: s.rsi["4h"]?.rsi ?? null,
          rsi1d: s.rsi["1d"]?.rsi ?? null,
          zone1h: s.rsi["1h"]?.zone ?? null,
          zone4h: s.rsi["4h"]?.zone ?? null,
          zone1d: s.rsi["1d"]?.zone ?? null,
        })),
      };
    }
    const k = interval === "1day" ? "1d" : (interval as "1h" | "4h" | "1d");
    return {
      interval,
      updatedAt,
      pairs: rows.flatMap((s) => {
        const r = s.rsi[k];
        return r ? [{ symbol: s.symbol, rsi: r.rsi, price: s.price, zone: r.zone, group: s.group, tier: s.tier, ts: r.ts }] : [];
      }),
    };
  }
  if ((m = p.match(/^\/rsi\/detail\/(.+)$/))) {
    const sym = decodeURIComponent(m[1]!);
    const s = (await demoMarket()).find((x) => x.symbol === sym);
    if (!s) throw new DemoApiMiss(p);
    const intervals = Object.fromEntries(Object.entries(s.rsi).filter(([, v]) => v));
    return { symbol: sym, label: s.label, group: s.group, price: s.price, intervals };
  }

  if (p === "/bars") {
    const bars = await listBars({
      symbol: q.get("symbol") ?? "",
      interval: (q.get("interval") ?? "1h") as "1h" | "1d",
      from: new Date(q.get("from") ?? Date.now() - 7 * D),
      to: new Date(q.get("to") ?? Date.now()),
    });
    const from = q.get("from") ?? "";
    return { bars: bars.filter((b) => b.ts >= from) };
  }

  if (p === "/news") {
    const affects = q.get("affects");
    const all = mockApprovedNews();
    return affects ? all.filter((n) => n.affects.some((a) => canon(a) === canon(affects))) : all;
  }
  if ((m = p.match(/^\/plans\/([^/]+)\/news$/))) {
    const id = m[1]!;
    return mockApprovedNews()
      .filter((n) => n.relatedPlanIds?.includes(id))
      .map(({ id, sourceCode, headline, fetchedAt, publishedAt }) => ({ id, sourceCode, headline, fetchedAt, publishedAt }));
  }
  if (p === "/plans/stats") throw new DemoApiMiss(p);
  // Admin lists, so the admin pages show the same desk content.
  if (p === "/plans/admin/all") return mockPublishedPlans();
  if (p === "/plans/admin/drafts") return [];
  if (p === "/bulletin") return mockBulletins();

  if (p === "/timeline") {
    const kinds = q.get("kinds")?.split(",") as TimelineKind[] | undefined;
    const from = q.get("from");
    const to = q.get("to");
    return mockTimelineEvents()
      .filter((e) => (!kinds || kinds.includes(e.kind)) && (!from || e.occurredAt >= from) && (!to || e.occurredAt <= to))
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, Number(q.get("limit") ?? 200));
  }
  if ((m = p.match(/^\/timeline\/([^/]+)$/))) {
    const e = mockTimelineEvents().find((x) => x.id === decodeURIComponent(m![1]!));
    if (!e) throw new DemoApiMiss(p);
    return e;
  }
  if ((m = p.match(/^\/events\/([^/]+)\/correlation$/))) {
    const e = mockTimelineEvents().find((x) => x.id === decodeURIComponent(m![1]!));
    if (!e) return [];
    // As the API: approved news within two hours either side of the release.
    const t = new Date(e.occurredAt).getTime();
    return mockApprovedNews()
      .filter((n) => n.id === e.newsItemId || Math.abs(new Date(n.publishedAt ?? n.fetchedAt).getTime() - t) <= 2 * H)
      .slice(0, 8);
  }

  if (p === "/tags/counts") {
    const news = mockApprovedNews();
    return HASHTAGS.map((tag) => {
      const newsCount = news.filter((n) => n.tags.includes(tag)).length;
      const primerCount = primers.filter((x) => x.tags.includes(tag)).length;
      return { tag, newsCount, primerCount, total: newsCount + primerCount };
    });
  }
  if ((m = p.match(/^\/tags\/([^/]+)\/news$/))) {
    const tag = decodeURIComponent(m[1]!);
    return mockApprovedNews().filter((n) => n.tags.includes(tag));
  }

  if (p === "/education") return primers;

  if (p === "/channel/threads") return mockChannelThreads();
  if (p === "/channel") return mockChannelPosts(q.get("threadId"));

  if (p === "/graph") return graph(q);

  if (p === "/subscription/status")
    return { tier: "vip", renewsAt: iso(-243 * D), signedLiability: true, joinedAt: iso(187 * D) };
  if (p === "/subscription/history")
    return [
      { id: "pay-2", externalRef: "INV-DEMO-0122", provider: "invoice", amount: 18_000_000, currency: "IDR", status: "paid", tier: "vip", invoiceUrl: "#", paidAt: iso(122 * D), createdAt: iso(122 * D) },
      { id: "pay-1", externalRef: "INV-DEMO-0118", provider: "invoice", amount: 18_000_000, currency: "IDR", status: "expired", tier: "vip", invoiceUrl: "#", paidAt: null, createdAt: iso(124 * D) },
    ];

  if (p === "/consult/sessions")
    return [{ id: CONSULT_ID, title: "Gold stop placement", status: "open", createdAt: iso(26 * H), updatedAt: iso(2 * H) }];
  if (p === `/consult/sessions/${CONSULT_ID}/messages`) return consultRows();
  if ((m = p.match(/^\/consult\/sessions\/[^/]+\/poll$/))) return { hasNew: false, latestAt: null };

  throw new DemoApiMiss(p);
}

function graph(q: URLSearchParams) {
  const types = q.get("types")?.split(",") ?? ["news", "plan", "channel", "event"];
  const symbols = q.get("symbols")?.split(",");
  type Node = { id: string; type: "news" | "plan" | "channel" | "event"; title: string; summary: string; symbols: string[]; tags: string[]; timestamp: string; meta: Record<string, unknown> };
  const nodes: Node[] = [];
  if (types.includes("news"))
    for (const n of mockApprovedNews())
      nodes.push({ id: n.id, type: "news", title: n.headline, summary: n.analysis.slice(0, 200), symbols: n.affects, tags: n.tags, timestamp: n.publishedAt ?? n.fetchedAt, meta: { impact: n.impact, bias: n.bias, sourceCode: n.sourceCode } });
  if (types.includes("plan"))
    for (const pl of mockPublishedPlans())
      nodes.push({ id: pl.id, type: "plan", title: `${pl.symbol} ${pl.direction.toUpperCase()}`, summary: pl.thesis.slice(0, 200), symbols: [pl.symbol], tags: pl.tags, timestamp: pl.publishedAt ?? pl.createdAt, meta: { direction: pl.direction, bias: pl.bias, status: pl.status } });
  if (types.includes("channel"))
    for (const c of mockChannelPosts())
      nodes.push({ id: c.id, type: "channel", title: c.body.slice(0, 60), summary: c.body.slice(0, 200), symbols: [], tags: c.tags, timestamp: c.createdAt, meta: { author: c.author } });
  if (types.includes("event"))
    for (const e of mockTimelineEvents().filter((x) => x.kind === "macro" || x.kind === "news"))
      nodes.push({ id: e.id, type: "event", title: e.title, summary: e.title, symbols: e.symbols, tags: [], timestamp: e.occurredAt, meta: { kind: e.kind, bias: e.bias, impact: e.impact, newsItemId: e.newsItemId } });

  const picked = nodes
    .filter((n) => !symbols || n.symbols.some((s) => symbols.includes(s)))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, Number(q.get("limit") ?? 200));

  // Same linking as apps/api graph.service computeEdges.
  const edges: { source: string; target: string; relation: "symbol" | "tag" | "timeline"; label: string }[] = [];
  const index = (key: (n: Node) => string[]) => {
    const map = new Map<string, string[]>();
    for (const n of picked) for (const k of key(n)) map.set(k, [...(map.get(k) ?? []), n.id]);
    return map;
  };
  const cap = Math.max(picked.length * 0.25, 3);
  for (const [relation, map] of [["symbol", index((n) => n.symbols)], ["tag", index((n) => n.tags)]] as const)
    for (const [label, ids] of map) {
      if (ids.length > cap) continue;
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) edges.push({ source: ids[i]!, target: ids[j]!, relation, label });
    }
  const ids = new Set(picked.map((n) => n.id));
  for (const n of picked)
    if (n.type === "event" && typeof n.meta.newsItemId === "string" && ids.has(n.meta.newsItemId))
      edges.push({ source: n.id, target: n.meta.newsItemId, relation: "timeline", label: "source" });

  const clusters = new Map<string, string[]>();
  for (const n of picked) if (n.symbols[0]) clusters.set(n.symbols[0], [...(clusters.get(n.symbols[0]) ?? []), n.id]);
  return {
    nodes: picked,
    edges,
    clusters: [...clusters].filter(([, v]) => v.length >= 2).map(([symbol, nodeIds]) => ({ symbol, nodeIds })),
  };
}

/** One backend call in demo. Writes succeed without persisting; reads come from fixtures and live market data. */
export async function demoApi(method: string, path: string, body?: unknown): Promise<unknown> {
  const p = new URL(path, "http://demo").pathname.replace(/\/+$/, "");
  if (p.startsWith("/black-friday")) {
    const res = demoBlackFriday(method, p, body);
    if (res !== undefined) return res;
  }
  if (method === "GET") return get(path);
  if (method === "DELETE") return null;
  return { id: crypto.randomUUID() };
}
