"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/ratelimit";
import { supabaseServer } from "@/lib/supabase/server";
import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";
import { CONSULT_MESSAGE_ROLES } from "@/features/consult/types";
import { DESK_SYSTEM_PROMPT } from "@/features/consult/lib/prompt";
import { pickReply } from "@/features/consult/lib/replies";
import { listConsultMessages } from "@/features/consult/queries/messages";

/**
 * Consult session / message server actions. Auth-gated — middleware already
 * blocks `/app/*` to unauthenticated users, but we re-check `getSession()`
 * as defence-in-depth and rely on RLS (migration 0019) to enforce ownership
 * at the DB layer.
 */

export interface ActionState {
  ok: boolean;
  error?: string;
  sessionId?: string;
  messageId?: string;
}

const CreateSessionSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
});

export async function createConsultSession(
  title?: string
): Promise<ActionState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  const rl = await rateLimit({
    key: `consult:create:${user.id}`,
    limit: 20,
    windowSec: 60,
  });
  if (!rl.success) return { ok: false, error: "rate_limited" };

  const parsed = CreateSessionSchema.safeParse({ title });
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("consult_sessions")
    .insert({
      user_id: user.id,
      title: parsed.data.title ?? "New session",
    })
    .select("id")
    .single();

  if (error || !data) {
    Sentry.captureException(error, {
      tags: { scope: "consult.createConsultSession" },
      extra: { userId: user.id },
    });
    logger.error("createConsultSession failed", {
      error,
      userId: user.id,
      scope: "consult.createConsultSession",
    });
    return { ok: false, error: "insert_failed" };
  }

  revalidatePath("/app/consult");
  return { ok: true, sessionId: data.id };
}

const AppendMessageSchema = z.object({
  sessionId: z.string().uuid(),
  role: z.enum(CONSULT_MESSAGE_ROLES),
  content: z.string().trim().min(1).max(10000),
});

export async function appendConsultMessage(input: {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
}): Promise<ActionState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  const rl = await rateLimit({
    key: `consult:append:${user.id}`,
    limit: 30,
    windowSec: 60,
  });
  if (!rl.success) return { ok: false, error: "rate_limited" };

  const parsed = AppendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "invalid_input",
    };
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("consult_messages")
    .insert({
      session_id: parsed.data.sessionId,
      user_id: user.id,
      role: parsed.data.role,
      content: parsed.data.content,
    })
    .select("id")
    .single();

  if (error || !data) {
    Sentry.captureException(error, {
      tags: { scope: "consult.appendConsultMessage" },
      extra: { userId: user.id, sessionId: parsed.data.sessionId },
    });
    logger.error("appendConsultMessage failed", {
      error,
      userId: user.id,
      sessionId: parsed.data.sessionId,
      scope: "consult.appendConsultMessage",
    });
    return { ok: false, error: "insert_failed" };
  }

  return { ok: true, messageId: data.id };
}

const RenameSessionSchema = z.object({
  sessionId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
});

export async function renameConsultSession(input: {
  sessionId: string;
  title: string;
}): Promise<ActionState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  const rl = await rateLimit({
    key: `consult:rename:${user.id}`,
    limit: 30,
    windowSec: 60,
  });
  if (!rl.success) return { ok: false, error: "rate_limited" };

  const parsed = RenameSessionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const supabase = supabaseServer();
  const { error } = await supabase
    .from("consult_sessions")
    .update({ title: parsed.data.title, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id);

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "consult.renameConsultSession" },
      extra: { userId: user.id, sessionId: parsed.data.sessionId },
    });
    logger.error("renameConsultSession failed", {
      error,
      userId: user.id,
      sessionId: parsed.data.sessionId,
      scope: "consult.renameConsultSession",
    });
    return { ok: false, error: "update_failed" };
  }

  revalidatePath("/app/consult");
  return { ok: true };
}

const SendConsultMessageSchema = z.object({
  sessionId: z.string().uuid(),
  body: z.string().trim().min(1).max(10000),
});

export type SendConsultResult =
  | { ok: true; assistantMessageId: string; assistantContent: string }
  | { ok: false; error: string };

/**
 * LLM-backed consult turn. Persists the user message, loads recent history,
 * calls OpenAI with the desk system prompt, persists the assistant reply,
 * and returns it. Falls back to the canned `pickReply` path when the key is
 * unset or the LLM call fails — the user's turn is never dropped. (L1 of the
 * consult carve-up; UI wiring lives in L2.)
 */
export async function sendConsultMessage(input: {
  sessionId: string;
  body: string;
}): Promise<SendConsultResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  const rl = await rateLimit({
    key: `consult:send:${user.id}`,
    limit: 10,
    windowSec: 60,
  });
  if (!rl.success) return { ok: false, error: "rate_limited" };

  const parsed = SendConsultMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "invalid_input",
    };
  }

  const { sessionId, body } = parsed.data;

  // 1. Persist the user turn via the existing helper (handles auth/RLS/rate
  //    limiting at its own layer — we rely on its return shape).
  const userAppend = await appendConsultMessage({
    sessionId,
    role: "user",
    content: body,
  });
  if (!userAppend.ok) {
    return { ok: false, error: userAppend.error ?? "append_user_failed" };
  }

  // 2. Load recent history (already ordered ascending by created_at). Slice
  //    to the last 20 turns — enough for context without blowing the prompt.
  const allMessages = await listConsultMessages(sessionId);
  const history = allMessages.slice(-20);

  // 3. Decide: LLM or canned fallback.
  const client = getOpenAI();
  let assistantContent: string | null = null;

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
      if (!text) {
        logger.warn("sendConsultMessage: empty completion, falling back", {
          sessionId,
          userId: user.id,
          scope: "consult.sendConsultMessage",
        });
        assistantContent = pickReply(body, history.length).body;
      } else {
        assistantContent = text;
      }
    } catch (err) {
      Sentry.captureException(err, {
        tags: { scope: "consult.sendConsultMessage" },
        extra: { userId: user.id, sessionId },
      });
      logger.error("sendConsultMessage: OpenAI call failed", {
        error: err,
        sessionId,
        userId: user.id,
        scope: "consult.sendConsultMessage",
      });
      assistantContent = pickReply(body, history.length).body;
    }
  }

  // 4. Persist the assistant turn.
  const assistantAppend = await appendConsultMessage({
    sessionId,
    role: "assistant",
    content: assistantContent,
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

const DeleteSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function deleteConsultSession(
  sessionId: string
): Promise<ActionState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  const rl = await rateLimit({
    key: `consult:delete:${user.id}`,
    limit: 30,
    windowSec: 60,
  });
  if (!rl.success) return { ok: false, error: "rate_limited" };

  const parsed = DeleteSessionSchema.safeParse({ sessionId });
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const supabase = supabaseServer();
  const { error } = await supabase
    .from("consult_sessions")
    .delete()
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id);

  if (error) {
    Sentry.captureException(error, {
      tags: { scope: "consult.deleteConsultSession" },
      extra: { userId: user.id, sessionId: parsed.data.sessionId },
    });
    logger.error("deleteConsultSession failed", {
      error,
      userId: user.id,
      sessionId: parsed.data.sessionId,
      scope: "consult.deleteConsultSession",
    });
    return { ok: false, error: "delete_failed" };
  }

  revalidatePath("/app/consult");
  return { ok: true };
}
