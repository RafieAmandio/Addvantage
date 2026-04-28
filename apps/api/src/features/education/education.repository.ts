import { prisma } from "@/config/database.js";

const LIST_SELECT = {
  slug: true,
  title: true,
  author: true,
  framework: true,
  summary: true,
  tags: true,
  readingMin: true,
  locked: true,
} as const;

const DETAIL_SELECT = {
  ...LIST_SELECT,
  body: true,
} as const;

export const educationRepository = {
  listPublished: (limit: number) =>
    prisma.educationPrimer.findMany({
      where: { published: true },
      select: LIST_SELECT,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    }),

  findBySlug: (slug: string) =>
    prisma.educationPrimer.findUnique({
      where: { slug },
      select: { ...DETAIL_SELECT, published: true },
    }),

  findById: (id: string) =>
    prisma.educationPrimer.findUnique({
      where: { id },
      select: { ...DETAIL_SELECT, published: true },
    }),
};
