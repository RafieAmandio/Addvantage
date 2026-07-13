import { prisma } from "@/config/database.js";

const SELECT = { slug: true, targetUrl: true, updatedAt: true } as const;

export const shortLinksRepository = {
  getBySlug: (slug: string) =>
    prisma.shortLink.findUnique({ where: { slug }, select: SELECT }),

  // Upsert so the row always exists even if the seed was skipped in an env.
  updateTarget: (slug: string, targetUrl: string) =>
    prisma.shortLink.upsert({
      where: { slug },
      update: { targetUrl },
      create: { slug, targetUrl },
      select: SELECT,
    }),
};
