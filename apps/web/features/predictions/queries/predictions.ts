import { prisma } from "@tradevantage/db";
import type { PredictionCardData, Outcome } from "../types";

export async function listPredictions(): Promise<PredictionCardData[]> {
  const tracked = await prisma.polymarketTracked.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
    },
  });

  const activeIds = tracked.filter((t) => t.eventId).map((t) => t.id);
  if (activeIds.length === 0) return [];

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const weekSnapshots = await prisma.polymarketSnapshot.findMany({
    where: {
      trackedId: { in: activeIds },
      fetchedAt: { gte: sevenDaysAgo },
    },
    orderBy: { fetchedAt: "asc" },
    select: { trackedId: true, outcomes: true },
  });

  const weekRangeByTracked = new Map<string, { min: number; max: number }>();
  for (const snap of weekSnapshots) {
    const snapOutcomes = snap.outcomes as unknown as Outcome[];
    const topProb = snapOutcomes[0]?.probability ?? 0;
    const existing = weekRangeByTracked.get(snap.trackedId);
    if (existing) {
      if (topProb < existing.min) existing.min = topProb;
      if (topProb > existing.max) existing.max = topProb;
    } else {
      weekRangeByTracked.set(snap.trackedId, { min: topProb, max: topProb });
    }
  }

  const results: PredictionCardData[] = [];

  for (const t of tracked) {
    if (!t.eventId) continue;

    const latest = t.snapshots[0];
    if (!latest) continue;

    const outcomes = (latest.outcomes as unknown as Outcome[]) ?? [];
    const raw = weekRangeByTracked.get(t.id);
    const weekRange = raw
      ? { min: Math.round(raw.min * 10) / 10, max: Math.round(raw.max * 10) / 10 }
      : null;

    results.push({
      tracked: {
        id: t.id,
        category: t.category,
        label: t.label,
        eventId: t.eventId,
        eventSlug: t.eventSlug,
        eventTitle: t.eventTitle,
        sortOrder: t.sortOrder,
      },
      outcomes,
      volume: latest.volume ? Number(latest.volume) : null,
      liquidity: latest.liquidity ? Number(latest.liquidity) : null,
      marketCount: latest.marketCount,
      fetchedAt: latest.fetchedAt.toISOString(),
      weekRange,
    });
  }

  return results;
}
