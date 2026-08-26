import type { Prisma } from "@tradevantage/db";
import { NotFoundError, ForbiddenError } from "@/core/errors/index.js";
import { consultRepository } from "./consult.repository.js";
import { notifyAdminsConsult } from "@/integrations/telegram/notify.js";
import { notifyConsultWhatsApp } from "@/integrations/whatsapp/notify.js";

export const consultService = {
  async verifySessionOwnership(userId: string, sessionId: string) {
    const session = await consultRepository.findSessionById(sessionId);
    if (!session) return null;
    if (session.userId !== userId) throw new ForbiddenError("Not your session");
    return session;
  },

  async listSessions(userId: string, limit = 50) {
    return consultRepository.listSessions(userId, limit);
  },

  async createSession(userId: string, title?: string) {
    return consultRepository.createSession(userId, title ?? "New session");
  },

  async renameSession(userId: string, sessionId: string, title: string) {
    const result = await consultRepository.renameSession(sessionId, userId, title);
    if (result.count === 0) throw new NotFoundError("Session not found");
  },

  async deleteSession(userId: string, sessionId: string) {
    const result = await consultRepository.deleteSession(sessionId, userId);
    if (result.count === 0) throw new NotFoundError("Session not found");
  },

  async listMessages(userId: string, sessionId: string, limit = 200) {
    const session = await consultRepository.findSessionById(sessionId);
    if (!session) throw new NotFoundError("Session not found");
    if (session.userId !== userId) throw new ForbiddenError("Not your session");
    return consultRepository.listMessages(sessionId, limit);
  },

  async appendMessage(
    userId: string,
    sessionId: string,
    data: { role: string; content: string; metadata?: Record<string, unknown> },
    userEmail?: string,
  ) {
    const session = await consultRepository.findSessionById(sessionId);
    if (!session) throw new NotFoundError("Session not found");
    if (session.userId !== userId) throw new ForbiddenError("Not your session");

    const result = await consultRepository.createMessage({
      sessionId,
      userId,
      role: data.role,
      content: data.content,
      ...(data.metadata ? { metadata: data.metadata as Prisma.InputJsonValue } : {}),
    });
    await consultRepository.updateSessionFlags(sessionId, {
      unreadAdmin: true,
      status: "awaiting_reply",
      updatedAt: new Date(),
    });

    notifyAdminsConsult({
      sessionId,
      sessionTitle: session.title,
      userEmail: userEmail ?? "",
      messagePreview: data.content,
    }).catch(() => {});

    // Member messages (text + images) also ping the WhatsApp group / tag Anthony.
    if (data.role === "user") {
      const imageUrl = (data.metadata as { imageUrl?: string } | undefined)?.imageUrl;
      // Members can opt out of being named; flag it so Anthony keeps them private.
      consultRepository
        .getAllowMention(userId)
        .then((allowMention) =>
          notifyConsultWhatsApp({
            sessionId,
            userEmail: userEmail ?? "",
            messagePreview: data.content,
            private: !allowMention,
            ...(imageUrl ? { imageUrl } : {}),
          }),
        )
        .catch(() => {});
    }

    return result;
  },

  // ── Admin methods ──

  async adminListSessions(filters?: { status?: string }) {
    return consultRepository.listAllSessions(filters);
  },

  async adminListMessages(sessionId: string) {
    const session = await consultRepository.findSessionById(sessionId);
    if (!session) throw new NotFoundError("Session not found");
    const [, messages] = await Promise.all([
      consultRepository.updateSessionFlags(sessionId, { unreadAdmin: false }),
      consultRepository.listMessages(sessionId, 200),
    ]);
    return messages;
  },

  async adminSendMessage(adminUserId: string, sessionId: string, content: string) {
    const session = await consultRepository.findSessionById(sessionId);
    if (!session) throw new NotFoundError("Session not found");

    const result = await consultRepository.createMessage({
      sessionId,
      userId: adminUserId,
      role: "admin",
      content,
    });
    await consultRepository.updateSessionFlags(sessionId, {
      unreadUser: true,
      status: "open",
      updatedAt: new Date(),
    });
    return result;
  },

  async adminCloseSession(sessionId: string) {
    const session = await consultRepository.findSessionById(sessionId);
    if (!session) throw new NotFoundError("Session not found");
    await consultRepository.updateSessionFlags(sessionId, { status: "closed" });
  },

  async getSessionStats() {
    return consultRepository.getSessionStats();
  },

  async pollSession(userId: string, sessionId: string, after?: string) {
    const session = await consultRepository.findSessionById(sessionId);
    if (!session) throw new NotFoundError("Session not found");
    if (session.userId !== userId) throw new ForbiddenError("Not your session");
    const latest = await consultRepository.getLatestMessage(sessionId);
    if (!latest) return { hasNew: false, latestMessageId: null, latestAt: null };
    const hasNew = after ? new Date(latest.createdAt) > new Date(after) : false;
    return {
      hasNew,
      latestMessageId: latest.id,
      latestAt: latest.createdAt.toISOString(),
    };
  },
};
