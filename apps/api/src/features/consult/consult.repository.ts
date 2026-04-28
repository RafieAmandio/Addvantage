import { prisma } from "@/config/database.js";
import type { Prisma } from "@tradevantage/db";

const SESSION_SELECT = {
  id: true,
  title: true,
  createdAt: true,
  updatedAt: true,
} as const;

const MESSAGE_SELECT = {
  id: true,
  sessionId: true,
  role: true,
  content: true,
  metadata: true,
  createdAt: true,
} as const;

export const consultRepository = {
  listSessions: (userId: string, limit: number) =>
    prisma.consultSession.findMany({
      where: { userId },
      select: SESSION_SELECT,
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),

  findSessionById: (id: string) =>
    prisma.consultSession.findUnique({
      where: { id },
      select: { ...SESSION_SELECT, userId: true },
    }),

  createSession: (userId: string, title: string) =>
    prisma.consultSession.create({
      data: { userId, title },
      select: { id: true },
    }),

  renameSession: (id: string, userId: string, title: string) =>
    prisma.consultSession.updateMany({
      where: { id, userId },
      data: { title },
    }),

  deleteSession: (id: string, userId: string) =>
    prisma.consultSession.deleteMany({
      where: { id, userId },
    }),

  listMessages: (sessionId: string, limit: number) =>
    prisma.consultMessage.findMany({
      where: { sessionId },
      select: MESSAGE_SELECT,
      orderBy: { createdAt: "asc" },
      take: limit,
    }),

  createMessage: (data: {
    sessionId: string;
    userId: string;
    role: string;
    content: string;
    metadata?: Prisma.InputJsonValue;
  }) =>
    prisma.consultMessage.create({
      data,
      select: { id: true },
    }),

  touchSession: (id: string) =>
    prisma.consultSession.update({
      where: { id },
      data: { updatedAt: new Date() },
    }),

  getDailyTokensUsed: (userId: string) =>
    prisma.$queryRaw<[{ total: bigint }]>`
      SELECT COALESCE(SUM((metadata->>'total_tokens')::int), 0) AS total
      FROM consult_messages
      WHERE user_id = ${userId}::uuid
        AND role = 'assistant'
        AND metadata->>'total_tokens' IS NOT NULL
        AND created_at >= (CURRENT_DATE AT TIME ZONE 'UTC')
    `,

  getProfileTier: (userId: string) =>
    prisma.profile.findUnique({
      where: { id: userId },
      select: { tier: true },
    }),
};
