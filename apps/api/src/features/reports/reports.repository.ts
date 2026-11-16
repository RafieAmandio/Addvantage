import { prisma } from "@/config/database.js";

export const reportsRepository = {
  listPublished: (limit: number) =>
    prisma.classReport.findMany({
      where: { published: true },
      select: {
        slug: true,
        title: true,
        summary: true,
        author: true,
        driveId: true,
        publishedAt: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { publishedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: limit,
    }),

  getProfileAccess: (userId: string) =>
    prisma.profile.findUnique({
      where: { id: userId },
      select: { tier: true, isAdmin: true },
    }),
};
