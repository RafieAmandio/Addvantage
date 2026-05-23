import { prisma } from "@/config/database.js";

export const referralRepository = {
  listActive: () =>
    prisma.referralPartner.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        category: true,
        tagline: true,
        url: true,
        iconUrl: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: "asc" },
    }),

  listAll: () =>
    prisma.referralPartner.findMany({
      orderBy: { sortOrder: "asc" },
    }),

  create: (data: { name: string; category: string; tagline: string; url: string; iconUrl?: string; sortOrder?: number }) =>
    prisma.referralPartner.create({ data }),

  update: (id: string, data: { name?: string; category?: string; tagline?: string; url?: string; iconUrl?: string | null; sortOrder?: number; active?: boolean }) =>
    prisma.referralPartner.update({ where: { id }, data }),

  remove: (id: string) =>
    prisma.referralPartner.delete({ where: { id } }),
};
