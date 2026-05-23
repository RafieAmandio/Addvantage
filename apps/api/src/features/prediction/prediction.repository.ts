import { prisma } from "@tradevantage/db";

export const predictionRepository = {
  async listTrackedWithLatestSnapshot() {
    return prisma.polymarketTracked.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        snapshots: {
          orderBy: { fetchedAt: "desc" },
          take: 1,
        },
      },
    });
  },

  async listWeekSnapshots(trackedIds: string[]) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return prisma.polymarketSnapshot.findMany({
      where: {
        trackedId: { in: trackedIds },
        fetchedAt: { gte: sevenDaysAgo },
      },
      orderBy: { fetchedAt: "asc" },
      select: { trackedId: true, outcomes: true },
    });
  },
};
