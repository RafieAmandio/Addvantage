import { ForbiddenError } from "@/core/errors/index.js";
import { upgradeRadarRepository } from "./upgrade-radar.repository.js";

const HORIZON_DAYS = 90;

// Upgrade Radar is VIP-only. The gate lives here so catalyst data never
// reaches free-tier clients (same pattern as the token-unlocks feature).
async function assertVipAccess(userId: string) {
  const profile = await upgradeRadarRepository.getProfileAccess(userId);
  if (!profile || (profile.tier !== "vip" && !profile.isAdmin)) {
    throw new ForbiddenError("VIP access required");
  }
}

export const upgradeRadarService = {
  async getUpcoming(userId: string) {
    await assertVipAccess(userId);

    const horizon = new Date(Date.now() + HORIZON_DAYS * 86400 * 1000);
    const [rows, meta] = await Promise.all([
      upgradeRadarRepository.listUpcoming(),
      upgradeRadarRepository.getMeta(),
    ]);

    const events = rows
      .filter((r) => r.dateStart <= horizon)
      .map((r) => ({
        id: r.eventId.toString(),
        geckoId: r.coinGeckoId,
        symbol: r.symbol,
        name: r.name,
        mcapRank: r.mcapRank,
        title: r.title,
        category: r.category,
        cmcCategory: r.cmcCategory,
        impact: r.impact,
        impactScore: r.impactScore !== null ? Number(r.impactScore) : null,
        dateStart: r.dateStart.toISOString(),
        dateApprox: r.dateApprox,
        displayDate: r.displayDate,
        source: r.source,
        coinIcon: r.coinIcon,
      }));

    return {
      updatedAt: meta?.syncedAt?.toISOString() ?? null,
      trackedTop200: meta?.trackedTop200 ?? 0,
      horizonDays: HORIZON_DAYS,
      events,
    };
  },
};
