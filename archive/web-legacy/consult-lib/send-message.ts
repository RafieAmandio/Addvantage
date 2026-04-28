import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";
import { DESK_SYSTEM_PROMPT } from "@/features/consult/lib/prompt";
import { pickReply } from "@/features/consult/lib/replies";
import { listConsultMessages } from "@/features/consult/queries/messages";
import { appendConsultMessage } from "@/features/consult/actions";

const SendConsultMessageSchema = z.object({
  sessionId: z.string().uuid(),
  body: z.string().trim().min(1).max(10000),
});

export type SendConsultReason = "rate_limited" | "daily_token_cap";

export type SendConsultResult =
  | { ok: true; assistantMessageId: string; assistantContent: string }
  | { ok: false; error: string; reason?: SendConsultReason };

export async function sendConsultMessageImpl(
  input: { sessionId: string; body: string },
  ctx: { userId: string }
): Promise<SendConsultResult> {
  const { userId } = ctx;

  const parsed = SendConsultMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "invalid_input",
    };
  }

  const { sessionId, body } = parsed.data;

  const userAppend = await appendConsultMessage({
    sessionId,
    role: "user",
    content: body,
  });
  if (!userAppend.ok) {
    return { ok: false, error: userAppend.error ?? "append_user_failed" };
  }

  const allMessages = await listConsultMessages(sessionId);
  const history = allMessages.slice(-20);

  const client = getOpenAI();
  let assistantContent: string | null = null;
  let assistantMetadata: Record<string, unknown> = {
    model: "fallback.pickReply",
    streamed: false,
  };

  if (!client) {
    const canned = pickReply(body, history.length);
    assistantContent = canned.body;
  } else {
    try {
      const completion = await client.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 0.4,
        messages: [
          { role: "system", content: DESK_SYSTEM_PROMPT },
          ...history.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user", content: body },
        ],
      });
      const text = completion.choices[0]?.message?.content?.trim();
      const usage = completion.usage;
      if (!text) {
        logger.warn("sendConsultMessage: empty completion, falling back", {
          sessionId,
          userId,
          scope: "consult.sendConsultMessage",
        });
        assistantContent = pickReply(body, history.length).body;
      } else {
        assistantContent = text;
        assistantMetadata = {
          model: OPENAI_MODEL,
          prompt_tokens: usage?.prompt_tokens,
          completion_tokens: usage?.completion_tokens,
          total_tokens: usage?.total_tokens,
          streamed: false,
        };
        logger.info("consult.llm", {
          scope: "consult.sendConsultMessage",
          sessionId,
          userId,
          promptTokens: usage?.prompt_tokens,
          completionTokens: usage?.completion_tokens,
          totalTokens: usage?.total_tokens,
          model: OPENAI_MODEL,
        });
        Sentry.addBreadcrumb({
          category: "consult.llm",
          level: "info",
          message: `tokens: ${usage?.total_tokens ?? "unknown"}`,
          data: {
            sessionId,
            model: OPENAI_MODEL,
            promptTokens: usage?.prompt_tokens,
            completionTokens: usage?.completion_tokens,
          },
        });
      }
    } catch (err) {
      Sentry.captureException(err, {
        tags: { scope: "consult.sendConsultMessage" },
        extra: { userId, sessionId },
      });
      logger.error("sendConsultMessage: OpenAI call failed", {
        error: err,
        sessionId,
        userId,
        scope: "consult.sendConsultMessage",
      });
      assistantContent = pickReply(body, history.length).body;
    }
  }

  const assistantAppend = await appendConsultMessage({
    sessionId,
    role: "assistant",
    content: assistantContent,
    metadata: assistantMetadata,
  });
  if (!assistantAppend.ok || !assistantAppend.messageId) {
    return {
      ok: false,
      error: assistantAppend.error ?? "append_assistant_failed",
    };
  }

  revalidatePath("/app/consult");
  return {
    ok: true,
    assistantMessageId: assistantAppend.messageId,
    assistantContent,
  };
}
