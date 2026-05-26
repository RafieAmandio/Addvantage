import { prisma } from "@/config/database.js";

const SELECT = {
  symbol: true,
  atr: true,
  price: true,
  dailyOpen: true,
  dailyHigh: true,
  dailyLow: true,
  dailyClose: true,
  upperLevel: true,
  lowerLevel: true,
  exhaustionPct: true,
  direction: true,
  ts: true,
  fetchedAt: true,
} as const;

export const atrRepository = {
  listAll: () =>
    prisma.atrSnapshot.findMany({
      select: SELECT,
      orderBy: { symbol: "asc" },
    }),

  findBySymbol: (symbol: string) =>
    prisma.atrSnapshot.findUnique({
      where: { symbol },
      select: SELECT,
    }),
};
