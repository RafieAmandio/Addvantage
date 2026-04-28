import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type OpenAI from "openai";
import { getProfile, getSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { enforceTierRateLimit, type Tier } from "@/lib/ratelimit-tier";
import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";
import { DESK_SYSTEM_PROMPT } from "@/features/consult/lib/prompt";
import { pickReply } from "@/features/consult/lib/replies";
import { listConsultMessages } from "@/features/consult/queries/messages";
import {
  FREE_DAILY_TOKEN_CAP,
  getDailyTokensUsed,
} from "@/features/consult/queries/usage";
import { appendConsultMessage } from "@/features/consult/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  sessionId: z.string().uuid(),
  body: z.string().trim().min(1).max(10000),
});

function jsonError(
  status: number,
  error: string,
  reason?: "rate_limited" | "daily_token_cap",
): Response {
  const body: Record<string, unknown> = { ok: false, error };
  if (reason) body.reason = reason;
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request): Promise<Response> {
  const user = await getSession();
  if (!user) return jsonError(401, "unauthorized");

  const profile = await getProfile();
  let tier: Tier = "free";
  if (profile?.tier === "vip" || profile?.tier === "free") {
    tier = profile.tier;
  } else {
    logger.debug("consult.stream: defaulting tier to free", {
      scope: "consult.stream",
      userId: user.id,
      observedTier: profile?.tier ?? null,
    });
  }
  const rl = await enforceTierRateLimit({
    userId: user.id,
    tier,
    action: "consult:send",
  });
  if (!rl.success) return jsonError(429, "rate_limited", "rate_limited");

  if (tier === "free") {
    const used = await getDailyTokensUsed(user.id);
    if (used >= FREE_DAILY_TOKEN_CAP) {
      logger.info("consult.stream: daily token cap reached", {
        scope: "consult.stream",
        userId: user.id,
        used,
        cap: FREE_DAILY_TOKEN_CAP,
      });
      return jsonError(429, "rate_limited", "daily_token_cap");
    }
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch (err) {
    logger.warn("consult.stream: invalid JSON body", {
      scope: "consult.stream",
      userId: user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return jsonError(400, "invalid_json");
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? "invalid_input");
  }
  const { sessionId, body } = parsed.data;

  const userAppend = await appendConsultMessage({
    sessionId,
    role: "user",
    content: body,
  });
  if (!userAppend.ok) {
    return jsonError(500, userAppend.error ?? "append_user_failed");
  }

  const allMessages = await listConsultMessages(sessionId);
  const history = allMessages.slice(-20);

  const encoder = new TextEncoder();
  const client = getOpenAI();

  if (!client) {
    const canned = pickReply(body, history.length).body;
    const assistantAppend = await appendConsultMessage({
      sessionId,
      role: "assistant",
      content: canned,
      metadata: { model: "fallback.pickReply", streamed: true },
    });
    if (!assistantAppend.ok) {
      return jsonError(500, assistantAppend.error ?? "append_assistant_failed");
    }
    revalidatePath("/app/consult");
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(canned));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  const userId = user.id;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullText = "";
      let fellBack = false;
      let usage: OpenAI.Completions.CompletionUsage | undefined;
      try {
        const completion = await client.chat.completions.create({
          model: OPENAI_MODEL,
          temperature: 0.4,
          stream: true,
          // Without include_usage, chunk.usage is always undefined
          stream_options: { include_usage: true },
          messages: [
            { role: "system", content: DESK_SYSTEM_PROMPT },
            ...history.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
        });
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            controller.enqueue(encoder.encode(delta));
          }
          if (chunk.usage) usage = chunk.usage;
        }
        if (!fullText.trim()) {
          const canned = pickReply(body, history.length).body;
          fullText = canned;
          fellBack = true;
          controller.enqueue(encoder.encode(canned));
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { scope: "consult.stream" },
          extra: { userId, sessionId },
        });
        logger.error("consult.stream: OpenAI call failed", {
          error: err,
          sessionId,
          userId,
          scope: "consult.stream",
        });
        const canned = pickReply(body, history.length).body;
        if (fullText.length > 0) {
          controller.enqueue(encoder.encode("\n\n"));
          fullText += "\n\n" + canned;
        } else {
          controller.enqueue(encoder.encode(canned));
          fullText = canned;
        }
        fellBack = true;
      }

      const metadata: Record<string, unknown> = fellBack
        ? { model: "fallback.pickReply", streamed: true }
        : {
            model: OPENAI_MODEL,
            prompt_tokens: usage?.prompt_tokens,
            completion_tokens: usage?.completion_tokens,
            total_tokens: usage?.total_tokens,
            streamed: true,
          };
      if (!fellBack) {
        logger.info("consult.llm", {
          scope: "consult.stream",
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

      try {
        const assistantAppend = await appendConsultMessage({
          sessionId,
          role: "assistant",
          content: fullText,
          metadata,
        });
        if (!assistantAppend.ok) {
          logger.error("consult.stream: assistant persist failed", {
            error: assistantAppend.error,
            sessionId,
            userId,
            fellBack,
            scope: "consult.stream",
          });
        }
        revalidatePath("/app/consult");
      } catch (err) {
        Sentry.captureException(err, {
          tags: { scope: "consult.stream.persist" },
          extra: { userId, sessionId },
        });
        logger.error("consult.stream: persist threw", {
          error: err,
          sessionId,
          userId,
          scope: "consult.stream.persist",
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
