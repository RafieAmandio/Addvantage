import { prisma } from "@/config/database.js";

const ROW_SELECT = {
  eventId: true,
  coinGeckoId: true,
  symbol: true,
  name: true,
  mcapRank: true,
  title: true,
  category: true,
  cmcCategory: true,
  impact: true,
  impactScore: true,
  dateStart: true,
  dateApprox: true,
  displayDate: true,
  source: true,
  coinIcon: true,
} as const;

export const upgradeRadarRepository = {
  listUpcoming: () =>
    prisma.upgradeEvent.findMany({
      where: { dateStart: { gte: new Date(Date.now() - 86400 * 1000) } },
      select: ROW_SELECT,
      orderBy: { dateStart: "asc" },
    }),

  getMeta: () => prisma.upgradeEventsMeta.findUnique({ where: { id: 1 } }),

  getProfileAccess: (userId: string) =>
    prisma.profile.findUnique({
      where: { id: userId },
      select: { tier: true, isAdmin: true },
    }),
};
