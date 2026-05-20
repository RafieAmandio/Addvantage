import { prisma } from "@/config/database.js";
import { Prisma } from "@tradevantage/db";
import type { PaginationOpts } from "@/core/utils/pagination.js";

const PLAN_SELECT = {
  id: true,
  symbol: true,
  thesis: true,
  direction: true,
  entry: true,
  stop: true,
  target: true,
  rMultiple: true,
  setups: true,
  tags: true,
  tier: true,
  status: true,
  outcome: true,
  closePrice: true,
  realizedR: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  closedAt: true,
  imageUrl: true,
  imageKey: true,
} as const;

export const planRepository = {
  findPublished: (opts: PaginationOpts & { symbol?: string }) => {
    const where: Prisma.TradingPlanWhereInput = { status: "published" };
    if (opts.symbol) where.symbol = opts.symbol;
    return prisma.tradingPlan.findMany({
      where,
      select: PLAN_SELECT,
      orderBy: { publishedAt: "desc" },
      skip: opts.skip,
      take: opts.limit,
    });
  },

  countPublished: (symbol?: string) => {
    const where: Prisma.TradingPlanWhereInput = { status: "published" };
    if (symbol) where.symbol = symbol;
    return prisma.tradingPlan.count({ where });
  },

  findById: (id: string) =>
    prisma.tradingPlan.findUnique({
      where: { id },
      select: PLAN_SELECT,
    }),

  findAllForAdmin: (opts: PaginationOpts) =>
    prisma.tradingPlan.findMany({
      select: PLAN_SELECT,
      orderBy: { updatedAt: "desc" },
      skip: opts.skip,
      take: opts.limit,
    }),

  countAll: () => prisma.tradingPlan.count(),

  findMyDrafts: (authorId: string, opts: PaginationOpts) =>
    prisma.tradingPlan.findMany({
      where: {
        authorId,
        status: { in: ["draft", "closed"] },
      },
      select: PLAN_SELECT,
      orderBy: { updatedAt: "desc" },
      skip: opts.skip,
      take: opts.limit,
    }),

  countMyDrafts: (authorId: string) =>
    prisma.tradingPlan.count({
      where: {
        authorId,
        status: { in: ["draft", "closed"] },
      },
    }),

  findClosedWithR: (limit: number) =>
    prisma.tradingPlan.findMany({
      where: {
        status: "closed",
        realizedR: { not: null },
      },
      select: {
        direction: true,
        outcome: true,
        realizedR: true,
      },
      take: limit,
    }),

  getNewsForPlan: (planId: string) =>
    prisma.newsItem.findMany({
      where: {
        status: "approved",
        relatedPlanIds: { has: planId },
      },
      select: {
        id: true,
        sourceCode: true,
        headline: true,
        fetchedAt: true,
        publishedAt: true,
      },
      orderBy: [{ publishedAt: "desc" }, { fetchedAt: "desc" }],
      take: 20,
    }),

  create: (data: {
    symbol: string;
    thesis: string;
    direction: string;
    entry?: number | null;
    stop?: number | null;
    target?: number | null;
    rMultiple?: number | null;
    setups: Prisma.InputJsonValue;
    tags: string[];
    tier: string;
    authorId: string;
  }) =>
    prisma.tradingPlan.create({
      data: {
        ...data,
        status: "draft",
      },
      select: { id: true },
    }),

  update: (
    id: string,
    data: Prisma.TradingPlanUpdateInput,
  ) =>
    prisma.tradingPlan.update({
      where: { id },
      data,
    }),

  remove: (id: string) =>
    prisma.tradingPlan.delete({ where: { id } }),
};
