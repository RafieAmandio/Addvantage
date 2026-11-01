import { prisma } from "@/config/database.js";
import type { Prisma } from "@tradevantage/db";

export const journalRepository = {
  listTrades: (userId: string) => prisma.journalTrade.findMany({ where: { userId }, orderBy: { openedAt: "desc" }, take: 2000 }),
  findTrade: (id: string, userId: string) => prisma.journalTrade.findFirst({ where: { id, userId } }),
  createTrade: (userId: string, data: Omit<Prisma.JournalTradeUncheckedCreateInput, "userId">) => prisma.journalTrade.create({ data: { ...data, userId } }),
  updateTrade: (id: string, data: Prisma.JournalTradeUpdateInput) => prisma.journalTrade.update({ where: { id }, data }),
  deleteTrade: (id: string, userId: string) => prisma.journalTrade.deleteMany({ where: { id, userId } }),

  getSettings: (userId: string) => prisma.traderSettings.findUnique({ where: { userId } }),
  upsertSettings: (userId: string, data: { equity: number; currency: string; riskTier: number }) =>
    prisma.traderSettings.upsert({ where: { userId }, create: { userId, ...data }, update: data }),

  getPlan: (userId: string, date: Date) => prisma.dailyPlan.findUnique({ where: { userId_date: { userId, date } } }),
  upsertPlan: (userId: string, date: Date, picks: Prisma.InputJsonValue) =>
    prisma.dailyPlan.upsert({ where: { userId_date: { userId, date } }, create: { userId, date, picks }, update: { picks } }),
};
