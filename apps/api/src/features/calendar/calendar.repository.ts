import { prisma } from "@/config/database.js";

const EVENT_SELECT = {
  id: true,
  kind: true,
  sourceCode: true,
  occurredAt: true,
  symbols: true,
  title: true,
  body: true,
  url: true,
  bias: true,
  impact: true,
  newsItemId: true,
  metadata: true,
} as const;

interface ListEventsInput {
  symbols?: string[];
  kinds?: string[];
  from: Date;
  to: Date;
  limit: number;
}

export const calendarRepository = {
  listEvents: (input: ListEventsInput) => {
    const where: Record<string, unknown> = {
      occurredAt: { gte: input.from, lte: input.to },
    };
    if (input.symbols && input.symbols.length > 0) {
      where.symbols = { hasSome: input.symbols };
    }
    if (input.kinds && input.kinds.length > 0) {
      where.kind = { in: input.kinds };
    }
    return prisma.timelineEvent.findMany({
      where,
      select: EVENT_SELECT,
      orderBy: { occurredAt: "desc" },
      take: input.limit,
    });
  },

  findEventById: (id: string) =>
    prisma.timelineEvent.findUnique({
      where: { id },
      select: { ...EVENT_SELECT, symbols: true, occurredAt: true },
    }),

  listCorrelatedNews: (symbols: string[], from: Date, to: Date, limit: number) =>
    prisma.newsItem.findMany({
      where: {
        status: "approved",
        publishedAt: { gte: from, lte: to },
        affects: { hasSome: symbols },
      },
      select: {
        id: true,
        sourceCode: true,
        headline: true,
        impact: true,
        bias: true,
        affects: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    }),
};
