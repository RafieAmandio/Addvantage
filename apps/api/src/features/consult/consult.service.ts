import type { Prisma } from "@tradevantage/db";
import { NotFoundError, ForbiddenError } from "@/core/errors/index.js";
import { logger } from "@/config/logger.js";
import { getOpenAI, LLM_MODEL } from "@/config/openai.js";
import { consultRepository } from "./consult.repository.js";
import { DESK_SYSTEM_PROMPT, pickReply, FREE_DAILY_TOKEN_CAP } from "./consult.lib.js";

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
  ) {
    const session = await consultRepository.findSessionById(sessionId);
    if (!session) throw new NotFoundError("Session not found");
    if (session.userId !== userId) throw new ForbiddenError("Not your session");

    const result = await consultRepository.createMessage({
      sessionId,
      userId,
      role: data.role,
      content: data.content,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
    });
    await consultRepository.touchSession(sessionId);
    return result;
  },

  async getUserTier(userId: string): Promise<"free" | "vip"> {
    const profile = await consultRepository.getProfileTier(userId);
    if (profile?.tier === "vip") return "vip";
    return "free";
  },

  async checkDailyTokenCap(userId: string): Promise<{ allowed: boolean; used: number }> {
    const rows = await consultRepository.getDailyTokensUsed(userId);
    const used = Number(rows[0]?.total ?? 0);
    return { allowed: used < FREE_DAILY_TOKEN_CAP, used };
  },

  async streamResponse(
    userId: string,
    sessionId: string,
    body: string,
    onChunk: (text: string) => void,
  ): Promise<{ metadata: Record<string, unknown> }> {
    const session = await consultRepository.findSessionById(sessionId);
    if (!session) throw new NotFoundError("Session not found");
    if (session.userId !== userId) throw new ForbiddenError("Not your session");

    await consultRepository.createMessage({
      sessionId,
      userId,
      role: "user",
      content: body,
    });
    await consultRepository.touchSession(sessionId);

    const messages = await consultRepository.listMessages(sessionId, 200);
    const history = messages.slice(-20);

    const client = getOpenAI();

    if (!client) {
      const canned = pickReply(body, history.length);
      onChunk(canned);
      const metadata: Record<string, unknown> = { model: "fallback.pickReply", streamed: true };
      await consultRepository.createMessage({
        sessionId,
        userId,
        role: "assistant",
        content: canned,
        metadata: metadata as Prisma.InputJsonValue,
      });
      return { metadata };
    }

    let fullText = "";
    let fellBack = false;
    let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;

    try {
      const completion = await client.chat.completions.create({
        model: LLM_MODEL,
        temperature: 0.4,
        stream: true,
        stream_options: { include_usage: true },
        messages: [
          { role: "system" as const, content: DESK_SYSTEM_PROMPT },
          ...history.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
      });

      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onChunk(delta);
        }
        if (chunk.usage) usage = chunk.usage;
      }

      if (!fullText.trim()) {
        const canned = pickReply(body, history.length);
        fullText = canned;
        fellBack = true;
        onChunk(canned);
      }
    } catch (err) {
      logger.error({ err, sessionId, userId, scope: "consult.stream" }, "OpenAI call failed");
      const canned = pickReply(body, history.length);
      if (fullText.length > 0) {
        onChunk("\n\n" + canned);
        fullText += "\n\n" + canned;
      } else {
        onChunk(canned);
        fullText = canned;
      }
      fellBack = true;
    }

    const metadata: Record<string, unknown> = fellBack
      ? { model: "fallback.pickReply", streamed: true }
      : {
          model: LLM_MODEL,
          prompt_tokens: usage?.prompt_tokens,
          completion_tokens: usage?.completion_tokens,
          total_tokens: usage?.total_tokens,
          streamed: true,
        };

    if (!fellBack) {
      logger.info({
        scope: "consult.stream",
        sessionId,
        userId,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        model: LLM_MODEL,
      }, "consult.llm");
    }

    await consultRepository.createMessage({
      sessionId,
      userId,
      role: "assistant",
      content: fullText,
      metadata: metadata as Prisma.InputJsonValue,
    });

    return { metadata };
  },
};
