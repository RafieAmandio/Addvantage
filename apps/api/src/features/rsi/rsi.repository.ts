import { prisma } from "@/config/database.js";

const SELECT = {
  symbol: true,
  interval: true,
  rsi: true,
  price: true,
  ts: true,
  fetchedAt: true,
} as const;

export const rsiRepository = {
  listByInterval: (interval: string) =>
    prisma.rsiSnapshot.findMany({
      where: { interval },
      select: SELECT,
      orderBy: { symbol: "asc" },
    }),

  listAll: () =>
    prisma.rsiSnapshot.findMany({
      select: SELECT,
      orderBy: [{ symbol: "asc" }, { interval: "asc" }],
    }),

  listBySymbol: (symbol: string) =>
    prisma.rsiSnapshot.findMany({
      where: { symbol },
      select: SELECT,
      orderBy: { interval: "asc" },
    }),
};
