import { prisma } from "@/config/database.js";

const NEWS_LIST_SELECT = {
  id: true,
  sourceCode: true,
  headline: true,
  analysis: true,
  impact: true,
  bias: true,
  affects: true,
  tags: true,
  author: true,
  publishedAt: true,
  fetchedAt: true,
  relatedPlanIds: true,
} as const;

export const searchRepository = {
  searchApprovedNews: (q: string, limit: number) =>
    prisma.newsItem.findMany({
      where: {
        status: "approved",
        OR: [
          { headline: { contains: q, mode: "insensitive" } },
          { analysis: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
        ],
      },
      select: NEWS_LIST_SELECT,
      orderBy: { publishedAt: "desc" },
      take: limit,
    }),
};
