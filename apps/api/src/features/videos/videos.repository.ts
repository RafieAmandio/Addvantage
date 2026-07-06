import { prisma } from "@/config/database.js";
import type { Prisma } from "@tradevantage/db";

const MEMBER_SELECT = {
  slug: true,
  title: true,
  description: true,
  category: true,
  provider: true,
  videoId: true,
  duration: true,
  sortOrder: true,
} as const;

const ADMIN_SELECT = {
  ...MEMBER_SELECT,
  id: true,
  published: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const videosRepository = {
  listPublished: (limit: number) =>
    prisma.videoModule.findMany({
      where: { published: true },
      select: MEMBER_SELECT,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: limit,
    }),

  findPublishedBySlug: (slug: string) =>
    prisma.videoModule.findUnique({
      where: { slug },
      select: { ...MEMBER_SELECT, published: true },
    }),

  listAll: () =>
    prisma.videoModule.findMany({
      select: ADMIN_SELECT,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),

  findById: (id: string) =>
    prisma.videoModule.findUnique({ where: { id }, select: ADMIN_SELECT }),

  create: (data: Prisma.VideoModuleCreateInput) =>
    prisma.videoModule.create({ data, select: ADMIN_SELECT }),

  update: (id: string, data: Prisma.VideoModuleUpdateInput) =>
    prisma.videoModule.update({ where: { id }, data, select: ADMIN_SELECT }),

  delete: (id: string) => prisma.videoModule.delete({ where: { id } }),

  getProfileAccess: (userId: string) =>
    prisma.profile.findUnique({
      where: { id: userId },
      select: { tier: true, isAdmin: true },
    }),
};
