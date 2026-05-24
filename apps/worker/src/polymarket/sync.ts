import { z } from "zod";
import * as Sentry from "@sentry/node";
import { prisma } from "@tradevantage/db";
import { retry } from "../lib/retry";
import { logger } from "../lib/logger";

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const UA = "TradeVantage/1.0";

// ─── Gamma API schemas ──────────────────────────────────────────────

const GammaMarketSchema = z.object({
  id: z.string(),
  question: z.string(),
  outcomes: z.string(),
  outcomePrices: z.string(),
  volume: z.string().optional(),
  liquidity: z.string().optional(),
  groupItemTitle: z.string().optional().nullable(),
  clobTokenIds: z.string().optional(),
  bestBid: z.number().optional().nullable(),
  bestAsk: z.number().optional().nullable(),
  oneDayPriceChange: z.number().optional().nullable(),
  oneWeekPriceChange: z.number().optional().nullable(),
});

const GammaEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  volume: z.number().optional(),
  liquidity: z.number().optional(),
  markets: z.array(GammaMarketSchema).default([]),
});

const GammaSearchResultSchema = z.object({
  events: z.array(GammaEventSchema).default([]),
});

// ─── Types ───────────────────────────────────────────────────────────

interface OutcomeSnapshot {
  label: string;
  probability: number;
  odds: number;
  tokenId: string | null;
  weekChange: number | null;
}

// ─── Fetch event by ID ──────────────────────────────────────────────

async function fetchEventById(eventId: string): Promise<z.infer<typeof GammaEventSchema> | null> {
  const raw = await retry(
    async () => {
      const res = await fetch(`${GAMMA_BASE}/events?id=${eventId}`, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`gamma/events: HTTP ${res.status}`);
      return (await res.json()) as unknown;
    },
    { label: `polymarket:event:${eventId}`, attempts: 2 },
  );

  const arr = z.array(GammaEventSchema).safeParse(raw);
  if (!arr.success || arr.data.length === 0) return null;
  return arr.data[0]!;
}

// ─── Search for events ──────────────────────────────────────────────

async function searchEvents(query: string, limit = 5): Promise<z.infer<typeof GammaEventSchema>[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  const raw = await retry(
    async () => {
      const res = await fetch(`${GAMMA_BASE}/public-search?${params}`, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`gamma/search: HTTP ${res.status}`);
      return (await res.json()) as unknown;
    },
    { label: `polymarket:search:${query}`, attempts: 2 },
  );

  const parsed = GammaSearchResultSchema.safeParse(raw);
  if (!parsed.success) return [];
  return parsed.data.events;
}

// ─── Parse market outcomes ──────────────────────────────────────────

function parseOutcomes(markets: z.infer<typeof GammaMarketSchema>[]): OutcomeSnapshot[] {
  const outcomes: OutcomeSnapshot[] = [];

  for (const m of markets) {
    let prices: number[];
    try {
      prices = JSON.parse(m.outcomePrices) as number[];
    } catch {
      continue;
    }

    let tokenIds: string[] = [];
    try {
      if (m.clobTokenIds) tokenIds = JSON.parse(m.clobTokenIds) as string[];
    } catch { /* ignore */ }

    const yesPrice = prices[0] ?? 0;
    const label = m.groupItemTitle ?? m.question;
    const prob = Math.round(yesPrice * 1000) / 10;
    const odds = yesPrice > 0 ? Math.round((1 / yesPrice) * 100) / 100 : 0;

    outcomes.push({
      label,
      probability: prob,
      odds,
      tokenId: tokenIds[0] ?? null,
      weekChange: m.oneWeekPriceChange ?? null,
    });
  }

  return outcomes
    .filter((o) => o.probability > 0 && o.probability < 100)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 10);
}

// ─── Sync snapshots ─────────────────────────────────────────────────

export async function syncPolymarketSnapshots(): Promise<void> {
  const tracked = await prisma.polymarketTracked.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  if (tracked.length === 0) {
    logger.debug("polymarket-sync: no active tracked events, skipping");
    return;
  }

  let persisted = 0;
  let errors = 0;

  for (const t of tracked) {
    try {
      if (!t.eventId) {
        logger.debug({ label: t.label }, "polymarket-sync: no event_id yet, skipping snapshot");
        continue;
      }

      const event = await fetchEventById(t.eventId);
      if (!event) {
        logger.warn({ eventId: t.eventId, label: t.label }, "polymarket-sync: event not found");
        errors++;
        continue;
      }

      const outcomes = parseOutcomes(event.markets);

      if (outcomes.length === 0) {
        logger.debug({ label: t.label, eventId: t.eventId }, "polymarket-sync: all outcomes resolved, skipping");
        continue;
      }

      await prisma.polymarketSnapshot.create({
        data: {
          trackedId: t.id,
          outcomes: JSON.parse(JSON.stringify(outcomes)),
          volume: event.volume ?? null,
          liquidity: event.liquidity ?? null,
          marketCount: event.markets.length,
        },
      });

      if (event.title !== t.eventTitle || event.slug !== t.eventSlug) {
        await prisma.polymarketTracked.update({
          where: { id: t.id },
          data: {
            eventTitle: event.title,
            eventSlug: event.slug,
            updatedAt: new Date(),
          },
        });
      }

      persisted++;
    } catch (err) {
      errors++;
      Sentry.captureException(err, { tags: { scope: "polymarket-sync", label: t.label } });
      logger.error({ label: t.label, err: String(err) }, "polymarket-sync: snapshot failed");
    }
  }

  logger.info({ persisted, errors, total: tracked.length }, "polymarket-sync: done");
}

// ─── Rotate slugs (daily) ───────────────────────────────────────────

export async function rotatePolymarketSlugs(): Promise<void> {
  const tracked = await prisma.polymarketTracked.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  if (tracked.length === 0) return;

  let updated = 0;

  for (const t of tracked) {
    try {
      const events = await searchEvents(t.searchQuery, 10);
      if (events.length === 0) {
        logger.warn({ query: t.searchQuery, label: t.label }, "polymarket-rotate: no events found");
        continue;
      }

      const candidates = events.filter((e) => {
        if (e.markets.length < 3 || (e.volume ?? 0) < 10_000) return false;
        const active = parseOutcomes(e.markets);
        return active.length >= 2;
      });

      if (candidates.length === 0) {
        logger.debug({ query: t.searchQuery, label: t.label }, "polymarket-rotate: no candidates with active outcomes");
        continue;
      }

      const best = candidates.reduce((a, b) =>
        (b.volume ?? 0) > (a.volume ?? 0) ? b : a,
      );

      if (best.id !== t.eventId) {
        await prisma.polymarketTracked.update({
          where: { id: t.id },
          data: {
            eventId: best.id,
            eventSlug: best.slug,
            eventTitle: best.title,
            updatedAt: new Date(),
          },
        });
        logger.info(
          { label: t.label, oldEventId: t.eventId, newEventId: best.id, newTitle: best.title, volume: best.volume },
          "polymarket-rotate: slug rotated",
        );
        updated++;
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { scope: "polymarket-rotate", label: t.label } });
      logger.error({ label: t.label, err: String(err) }, "polymarket-rotate: failed");
    }
  }

  logger.info({ updated, total: tracked.length }, "polymarket-rotate: done");
}

