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
} as const;

interface ListParams {
  symbols?: string[];
  kinds?: string[];
  from?: string;
  to?: string;
  limit: number;
}

export const timelineRepository = {
  list: (params: ListParams) => {
    const where: Record<string, unknown> = {};
    if (params.symbols && params.symbols.length > 0) {
      where.symbols = { hasSome: params.symbols };
    }
    if (params.kinds && params.kinds.length > 0) {
      where.kind = { in: params.kinds };
    }
    if (params.from || params.to) {
      const range: Record<string, Date> = {};
      if (params.from) range.gte = new Date(params.from);
      if (params.to) range.lte = new Date(params.to);
      where.occurredAt = range;
    }
    return prisma.timelineEvent.findMany({
      where,
      select: EVENT_SELECT,
      orderBy: { occurredAt: "desc" },
      take: params.limit,
    });
  },

  findById: (id: string) =>
    prisma.timelineEvent.findUnique({
      where: { id },
      select: EVENT_SELECT,
    }),

  createPin: (data: {
    title: string;
    body: string | null;
    symbols: string[];
    occurredAt: Date;
    createdBy: string;
  }) =>
    prisma.timelineEvent.create({
      data: {
        kind: "user_pin",
        sourceCode: "USER",
        occurredAt: data.occurredAt,
        symbols: data.symbols,
        title: data.title,
        body: data.body,
        createdBy: data.createdBy,
      },
      select: { id: true },
    }),
};
