import { prisma } from "@/config/database.js";

export const sourceRepository = {
  findAll: () =>
    prisma.source.findMany({
      select: {
        code: true,
        name: true,
        url: true,
        enabled: true,
        pollMinutes: true,
        lastPolledAt: true,
        lastSuccessAt: true,
        lastError: true,
      },
      orderBy: { code: "asc" },
    }),
};
