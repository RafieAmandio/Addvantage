/**
 * Adapts the legacy prototype mocks (features/[name]/mock.ts) into the DB row
 * shapes returned by the real query functions. Query functions short-circuit
 * here when `NEXT_PUBLIC_MOCK_MODE=1` so the web app renders without Supabase.
 *
 * Every helper returns already-validated, query-shaped data — consumers do
 * not re-parse with Zod, they use the output directly.
 */
import type { NewsListItem } from "@/features/news/queries/news";
import type { Plan, ClosedPlanStats } from "@/features/plan/types";
import type { TimelineEvent } from "@/features/timeline/types";
import { news as mockNews } from "@/features/news/mock";
import { tradingPlans as mockPlans } from "@/features/plan/mock";
import { calendar as mockCalendar } from "@/features/calendar/mock";

function deriveSourceCode(author: string): string {
  // The prototype mocks are signed by ANTS authors (Anthony, etc.), which
  // isn't a valid source_code in the real schema. The news UI only renders
  // `source_code` as a small byline chip, so anything short works.
  return author.slice(0, 4).toUpperCase();
}

export function mockApprovedNews(): NewsListItem[] {
  return mockNews.map((n) => ({
    id: n.id,
    source_code: deriveSourceCode(n.author),
    headline: n.headline,
    analysis: n.analysis,
    impact: n.impact,
    bias: n.bias,
    affects: n.affects,
    tags: n.tags,
    author: n.author,
    published_at: n.ts,
    fetched_at: n.ts,
    related_plan_ids: n.relatedPlanIds ?? [],
  }));
}

export function mockApprovedNewsById(id: string): NewsListItem | null {
  return mockApprovedNews().find((n) => n.id === id) ?? null;
}

/**
 * Map the prototype `TradingPlan` shape into the DB `Plan` row shape. The
 * mock richness (setups with targets[], confidence, etc.) survives via the
 * `.passthrough()` on `PlanSetupSchema` — the PlanDetail component reads
 * those same keys off the setup entries.
 */
export function mockPublishedPlans(): Plan[] {
  return mockPlans.map((p, idx): Plan => {
    const primary = p.setups[0];
    const isLatest = idx === 0;
    return {
      id: p.id,
      symbol: primary?.instrument ?? "—",
      thesis: p.thesis,
      direction: primary?.direction ?? "long",
      entry: null,
      stop: null,
      target: null,
      r_multiple: null,
      setups: p.setups.map((s) => ({
        label: s.instrument,
        trigger: s.entry,
        invalidation: s.invalidation,
        note: s.rationale,
        // Extra prototype-only fields ride through via `.passthrough()`.
        instrument: s.instrument,
        direction: s.direction,
        bias: s.bias,
        entry: s.entry,
        stop: s.stop,
        targets: s.targets,
        rationale: s.rationale,
        confidence: s.confidence,
        tags: s.tags,
        ...(s.outcome ? { outcome: s.outcome } : {}),
        ...(s.outcomeNotes ? { outcomeNotes: s.outcomeNotes } : {}),
        ...(s.outcomeR ? { outcomeR: s.outcomeR } : {}),
      })),
      tags: Array.from(new Set(p.setups.flatMap((s) => s.tags))),
      tier: "free",
      status: isLatest ? "published" : "closed",
      outcome: isLatest ? null : "win",
      close_price: null,
      realized_r: isLatest ? null : 1.65,
      author_id: null,
      created_at: `${p.date}T08:00:00Z`,
      updated_at: `${p.date}T08:00:00Z`,
      published_at: `${p.date}T08:00:00Z`,
      closed_at: isLatest ? null : `${p.date}T20:00:00Z`,
    };
  });
}

export function mockPlanById(id: string): Plan | null {
  return mockPublishedPlans().find((p) => p.id === id) ?? null;
}

export function mockClosedPlanStats(): ClosedPlanStats {
  return {
    n: 24,
    winRate: 0.625,
    avgR: 0.84,
    byDirection: {
      long: { n: 11, winRate: 0.636, avgR: 0.92 },
      short: { n: 13, winRate: 0.615, avgR: 0.78 },
    },
  };
}

function regionToSymbol(region: string): string {
  switch (region) {
    case "US":
      return "USD";
    case "EU":
      return "EUR";
    case "UK":
      return "GBP";
    case "JP":
      return "JPY";
    case "CN":
      return "CNY";
    case "ID":
      return "IDR";
    default:
      return "GLOBAL";
  }
}

/**
 * Project the prototype calendar rows into `timeline_events` shape
 * (`kind='macro'`). `/app/calendar` calls `listTimelineEvents({ kinds: ['macro'], from, to })`
 * and re-projects to `CalendarEvent` via `timelineEventToCalendarEvent`; the
 * roundtrip is lossy in the real path too, so we match it here.
 */
export function mockTimelineMacroEvents(params: {
  from?: string;
  to?: string;
}): TimelineEvent[] {
  const { from, to } = params;
  return mockCalendar
    .filter((e) => {
      if (from && e.ts < from) return false;
      if (to && e.ts > to) return false;
      return true;
    })
    .map(
      (e): TimelineEvent => ({
        id: e.id,
        kind: "macro",
        source_code: "FF",
        occurred_at: e.ts,
        symbols: [regionToSymbol(e.region)],
        title: e.title,
        body: e.notes ?? null,
        url: null,
        bias: null,
        impact: e.impact,
        news_item_id: e.relatedNewsId ?? null,
      })
    );
}
