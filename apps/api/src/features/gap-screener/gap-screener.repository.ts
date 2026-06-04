import { prisma } from "@/config/database.js";

const SNAPSHOT_SELECT = {
  symbol: true,
  fridayClose: true,
  mondayOpen: true,
  currentPrice: true,
  gapPct: true,
  gapDirection: true,
  fillPct: true,
  status: true,
  weekStart: true,
  ts: true,
  fetchedAt: true,
} as const;

export const gapScreenerRepository = {
  listActive: () =>
    prisma.gapSnapshot.findMany({
      where: { status: { not: "expired" } },
      select: SNAPSHOT_SELECT,
      orderBy: { gapPct: "desc" },
    }),

  listAll: () =>
    prisma.gapSnapshot.findMany({
      select: SNAPSHOT_SELECT,
      orderBy: { gapPct: "desc" },
    }),
};
