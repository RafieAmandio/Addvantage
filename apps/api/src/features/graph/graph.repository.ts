import { prisma } from "@/config/database.js";
import type { GraphQuery } from "./graph.validation.js";

const NEWS_SELECT = {
  id: true,
  headline: true,
  analysis: true,
  impact: true,
  bias: true,
  affects: true,
  tags: true,
  sourceCode: true,
  publishedAt: true,
  createdAt: true,
} as const;

const PLAN_SELECT = {
  id: true,
  symbol: true,
  thesis: true,
  direction: true,
  bias: true,
  tags: true,
  status: true,
  publishedAt: true,
  createdAt: true,
} as const;

const CHANNEL_SELECT = {
  id: true,
  body: true,
  author: true,
  tags: true,
  createdAt: true,
} as const;

const EVENT_SELECT = {
  id: true,
  kind: true,
  title: true,
  symbols: true,
  bias: true,
  impact: true,
  newsItemId: true,
  occurredAt: true,
  createdAt: true,
} as const;

function dateRange(q: GraphQuery) {
  const range: Record<string, Date> = {};
  if (q.from) range.gte = q.from;
  if (q.to) range.lte = q.to;
  return Object.keys(range).length > 0 ? range : undefined;
}

export const graphRepository = {
  async fetchNews(q: GraphQuery, limit: number) {
    const where: Record<string, unknown> = { status: "approved" };
    if (q.symbols) where.affects = { hasSome: q.symbols };
    if (q.tags) where.tags = { hasSome: q.tags };
    const dr = dateRange(q);
    if (dr) where.publishedAt = dr;
    return prisma.newsItem.findMany({
      where,
      select: NEWS_SELECT,
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
  },

  async fetchPlans(q: GraphQuery, limit: number) {
    const where: Record<string, unknown> = { status: "published" };
    if (q.symbols) where.symbol = { in: q.symbols };
    if (q.tags) where.tags = { hasSome: q.tags };
    const dr = dateRange(q);
    if (dr) where.publishedAt = dr;
    return prisma.tradingPlan.findMany({
      where,
      select: PLAN_SELECT,
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
  },

  async fetchChannel(q: GraphQuery, limit: number) {
    const where: Record<string, unknown> = { published: true };
    if (q.tags) where.tags = { hasSome: q.tags };
    const dr = dateRange(q);
    if (dr) where.createdAt = dr;
    return prisma.channelPost.findMany({
      where,
      select: CHANNEL_SELECT,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async fetchEvents(q: GraphQuery, limit: number) {
    const where: Record<string, unknown> = {};
    if (q.symbols) where.symbols = { hasSome: q.symbols };
    const dr = dateRange(q);
    if (dr) where.occurredAt = dr;
    return prisma.timelineEvent.findMany({
      where,
      select: EVENT_SELECT,
      orderBy: { occurredAt: "desc" },
      take: limit,
    });
  },
};
