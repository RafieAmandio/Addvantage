import { ForbiddenError } from "@/core/errors/index.js";
import { reportsRepository } from "./reports.repository.js";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

export const reportsService = {
  // VIP-only, gated here (not client-side) so drive_id never reaches free-tier
  // clients. Same convention as videos.
  async listPublished(userId: string, limit?: number) {
    const profile = await reportsRepository.getProfileAccess(userId);
    if (!profile || (profile.tier !== "vip" && !profile.isAdmin)) {
      throw new ForbiddenError("VIP access required");
    }
    const take = limit && Number.isInteger(limit) && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;
    return reportsRepository.listPublished(take);
  },
};
