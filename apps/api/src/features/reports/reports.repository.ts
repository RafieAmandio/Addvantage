import { prisma } from "@/config/database.js";
import type { Prisma } from "@tradevantage/db";

const MEMBER_SELECT = {
  slug: true,
  title: true,
  summary: true,
  author: true,
  driveId: true,
  publishedAt: true,
  sortOrder: true,
} as const;

const ADMIN_SELECT = {
  ...MEMBER_SELECT,
  id: true,
  published: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const reportsRepository = {
  listPublished: (limit: number) =>
    prisma.classReport.findMany({
      where: { published: true },
      select: MEMBER_SELECT,
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
      take: limit,
    }),

  findPublishedBySlug: (slug: string) =>
    prisma.classReport.findUnique({
      where: { slug },
      select: { ...MEMBER_SELECT, published: true },
    }),

  listAll: () =>
    prisma.classReport.findMany({
      select: ADMIN_SELECT,
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    }),

  findById: (id: string) =>
    prisma.classReport.findUnique({ where: { id }, select: ADMIN_SELECT }),

  create: (data: Prisma.ClassReportCreateInput) =>
    prisma.classReport.create({ data, select: ADMIN_SELECT }),

  update: (id: string, data: Prisma.ClassReportUpdateInput) =>
    prisma.classReport.update({ where: { id }, data, select: ADMIN_SELECT }),

  delete: (id: string) => prisma.classReport.delete({ where: { id } }),

  getProfileAccess: (userId: string) =>
    prisma.profile.findUnique({
      where: { id: userId },
      select: { tier: true, isAdmin: true },
    }),
};
