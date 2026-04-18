"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/ratelimit";
import { supabaseServer } from "@/lib/supabase/server";
import { CONSULT_MESSAGE_ROLES } from "@/features/consult/types";

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
