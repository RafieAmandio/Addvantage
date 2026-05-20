import { prisma } from "@/config/database.js";

export const rsiRepository = {
  listByInterval: (interval: string) =>
    prisma.rsiSnapshot.findMany({
      where: { interval },
      select: {
        symbol: true,
        rsi: true,
        price: true,
        ts: true,
        fetchedAt: true,
      },
      orderBy: { symbol: "asc" },
    }),
};
