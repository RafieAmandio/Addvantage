import { prisma } from "@/config/database.js";

export const macroRepository = {
  latest: () => prisma.macroSnapshot.findUnique({ where: { id: 1 }, select: { data: true, syncedAt: true } }),
};
