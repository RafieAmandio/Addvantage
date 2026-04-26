"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getProfile, getSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { enforceTierRateLimit, type Tier } from "@/lib/ratelimit-tier";
import { enforceUserRateLimit } from "@/lib/user-ratelimit";
import { supabaseServer } from "@/lib/supabase/server";
import { CONSULT_MESSAGE_ROLES } from "@/features/consult/types";
import {
  sendConsultMessageImpl,
  type SendConsultResult,
} from "@/features/consult/lib/send-message";
import {
  FREE_DAILY_TOKEN_CAP,
  getDailyTokensUsed,
} from "@/features/consult/queries/usage";
import type { Json } from "@tradevantage/db";

interface ActionState {
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

  try {
    await enforceUserRateLimit(user.id, "consult:create", {
      limit: 20,
      scope: "consult.createConsultSession",
    });
  } catch {
    return { ok: false, error: "rate_limited" };
  }

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
  metadata: z.record(z.unknown()).optional(),
});

export async function appendConsultMessage(input: {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<ActionState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    await enforceUserRateLimit(user.id, "consult:append", {
      limit: 30,
      scope: "consult.appendConsultMessage",
    });
  } catch {
    return { ok: false, error: "rate_limited" };
  }

  const parsed = AppendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "invalid_input",
    };
  }

  const supabase = supabaseServer();
  const metadataJson: Json | null = parsed.data.metadata
    ? (JSON.parse(JSON.stringify(parsed.data.metadata)) as Json)
    : null;
  const { data, error } = await supabase
    .from("consult_messages")
    .insert({
      session_id: parsed.data.sessionId,
      user_id: user.id,
      role: parsed.data.role,
      content: parsed.data.content,
      metadata: metadataJson,
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

  try {
    await enforceUserRateLimit(user.id, "consult:rename", {
      limit: 30,
      scope: "consult.renameConsultSession",
    });
  } catch {
    return { ok: false, error: "rate_limited" };
  }

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

export async function sendConsultMessage(input: {
  sessionId: string;
  body: string;
}): Promise<SendConsultResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  const profile = await getProfile();
  let tier: Tier = "free";
  if (profile?.tier === "vip" || profile?.tier === "free") {
    tier = profile.tier;
  } else {
    logger.debug("sendConsultMessage: defaulting tier to free", {
      scope: "consult.sendConsultMessage",
      userId: user.id,
      observedTier: profile?.tier ?? null,
    });
  }
  const rl = await enforceTierRateLimit({
    userId: user.id,
    tier,
    action: "consult:send",
  });
  if (!rl.success)
    return { ok: false, error: "rate_limited", reason: "rate_limited" };

  if (tier === "free") {
    const used = await getDailyTokensUsed(user.id);
    if (used >= FREE_DAILY_TOKEN_CAP) {
      logger.info("consult.sendConsultMessage: daily token cap reached", {
        scope: "consult.sendConsultMessage",
        userId: user.id,
        used,
        cap: FREE_DAILY_TOKEN_CAP,
      });
      return {
        ok: false,
        error: "rate_limited",
        reason: "daily_token_cap",
      };
    }
  }

  return sendConsultMessageImpl(input, { userId: user.id });
}

const DeleteSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function deleteConsultSession(
  sessionId: string
): Promise<ActionState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    await enforceUserRateLimit(user.id, "consult:delete", {
      limit: 30,
      scope: "consult.deleteConsultSession",
    });
  } catch {
    return { ok: false, error: "rate_limited" };
  }

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
