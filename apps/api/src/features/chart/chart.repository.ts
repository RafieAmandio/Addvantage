import { prisma } from "@/config/database.js";

interface ListBarsInput {
  symbol: string;
  interval: string;
  from: Date;
  to: Date;
  limit: number;
}

export const chartRepository = {
  listBars: (input: ListBarsInput) =>
    prisma.instrumentBar.findMany({
      where: {
        symbol: input.symbol,
        interval: input.interval,
        ts: { gte: input.from, lte: input.to },
      },
      select: {
        ts: true,
        open: true,
        high: true,
        low: true,
        close: true,
        volume: true,
      },
      orderBy: { ts: "asc" },
      take: input.limit,
    }),
};
