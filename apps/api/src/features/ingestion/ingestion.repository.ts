import { prisma } from "@/config/database.js";

const RUN_SELECT = {
  id: true,
  sourceCode: true,
  startedAt: true,
  finishedAt: true,
  status: true,
  itemsFetched: true,
  itemsNew: true,
  itemsRephrased: true,
  error: true,
} as const;

const SOURCE_SELECT = {
  code: true,
  name: true,
} as const;

export const ingestionRepository = {
  listRuns: (limit: number) =>
    prisma.ingestionRun.findMany({
      select: RUN_SELECT,
      orderBy: { startedAt: "desc" },
      take: limit,
    }),

  listSources: () =>
    prisma.source.findMany({
      select: SOURCE_SELECT,
      orderBy: { code: "asc" },
    }),
};
