import { prisma } from "@/config/database.js";
import type { Prisma } from "@tradevantage/db";

const SESSION_SELECT = {
  id: true,
  title: true,
  status: true,
  unreadAdmin: true,
  unreadUser: true,
  createdAt: true,
  updatedAt: true,
} as const;

const MESSAGE_SELECT = {
  id: true,
  sessionId: true,
  userId: true,
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
      data: { userId, title, status: "open", unreadAdmin: true },
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

  updateSessionFlags: (
    id: string,
    data: { status?: string; unreadAdmin?: boolean; unreadUser?: boolean; updatedAt?: Date },
  ) =>
    prisma.consultSession.update({
      where: { id },
      data,
    }),

  // ── Admin queries ──

  listAllSessions: (filters?: { status?: string }, limit = 50) =>
    prisma.consultSession.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      select: {
        ...SESSION_SELECT,
        userId: true,
        user: { select: { email: true, handle: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),

  getSessionStats: () =>
    Promise.all([
      prisma.consultSession.count({ where: { status: "open" } }),
      prisma.consultSession.count({ where: { status: "awaiting_reply" } }),
      prisma.consultSession.count({ where: { unreadAdmin: true, status: { not: "closed" } } }),
    ]).then(([open, awaitingReply, unread]) => ({ open, awaitingReply, unread })),

  getLatestMessage: (sessionId: string) =>
    prisma.consultMessage.findFirst({
      where: { sessionId },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
};
