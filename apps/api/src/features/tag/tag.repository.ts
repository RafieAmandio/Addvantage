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

export const tagRepository = {
  listApprovedNewsTags: () =>
    prisma.newsItem.findMany({
      where: { status: "approved" },
      select: { tags: true },
    }),

  listPublishedPrimerTags: () =>
    prisma.educationPrimer.findMany({
      where: { published: true },
      select: { tags: true },
    }),

  listNewsByTag: (tag: string, limit: number) =>
    prisma.newsItem.findMany({
      where: {
        status: "approved",
        tags: { has: tag },
      },
      select: NEWS_LIST_SELECT,
      orderBy: { publishedAt: "desc" },
      take: limit,
    }),
};
