import { prisma } from "@/config/database.js";

const ROW_SELECT = {
  geckoId: true,
  unlockAt: true,
  symbol: true,
  name: true,
  mcapRank: true,
  tokens: true,
  pctSupply: true,
  usdValue: true,
  price: true,
  categories: true,
  recipients: true,
} as const;

export const tokenUnlocksRepository = {
  listUpcoming: () =>
    prisma.tokenUnlock.findMany({
      where: { unlockAt: { gte: new Date() } },
      select: ROW_SELECT,
      orderBy: { unlockAt: "asc" },
    }),

  getMeta: () => prisma.tokenUnlocksMeta.findUnique({ where: { id: 1 } }),

  getProfileAccess: (userId: string) =>
    prisma.profile.findUnique({
      where: { id: userId },
      select: { tier: true, isAdmin: true },
    }),
};
