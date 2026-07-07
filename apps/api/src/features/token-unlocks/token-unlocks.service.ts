import { ForbiddenError } from "@/core/errors/index.js";
import { tokenUnlocksRepository } from "./token-unlocks.repository.js";

// Display thresholds. The worker stores a wider band (>= 2% of circulating
// supply) so these can be tuned without a resync.
const MIN_PCT_SUPPLY = 4.9;
const HORIZON_DAYS = 90;

// Token unlocks are VIP-only. The gate lives here so unlock data never
// reaches free-tier clients (same pattern as the videos feature).
async function assertVipAccess(userId: string) {
  const profile = await tokenUnlocksRepository.getProfileAccess(userId);
  if (!profile || (profile.tier !== "vip" && !profile.isAdmin)) {
    throw new ForbiddenError("VIP access required");
  }
}

export const tokenUnlocksService = {
  async getUpcoming(userId: string) {
    await assertVipAccess(userId);

    const horizon = new Date(Date.now() + HORIZON_DAYS * 86400 * 1000);
    const [rows, meta] = await Promise.all([
      tokenUnlocksRepository.listUpcoming(),
      tokenUnlocksRepository.getMeta(),
    ]);

    const events = rows
      .filter((r) => Number(r.pctSupply) > MIN_PCT_SUPPLY && r.unlockAt <= horizon)
      .map((r) => ({
        geckoId: r.geckoId,
        unlockAt: r.unlockAt.toISOString(),
        symbol: r.symbol,
        name: r.name,
        mcapRank: r.mcapRank,
        tokens: Number(r.tokens),
        pctSupply: Number(r.pctSupply),
        usdValue: Number(r.usdValue),
        price: Number(r.price),
        categories: r.categories,
        recipients: r.recipients,
      }));

    return {
      updatedAt: meta?.syncedAt?.toISOString() ?? null,
      trackedTop200: meta?.trackedTop200 ?? 0,
      horizonDays: HORIZON_DAYS,
      minPctSupply: MIN_PCT_SUPPLY,
      events,
    };
  },
};
