"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { apiPost, apiPut, apiDelete } from "@/lib/api/client-server";

interface ActionState {
  ok: boolean;
  error?: string;
  sessionId?: string;
  messageId?: string;
}

export async function createConsultSession(
  title?: string
): Promise<ActionState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    const data = await apiPost<{ id: string }>("/consult/sessions", {
      title: title ?? "New session",
    });
    revalidatePath("/app/consult");
    return { ok: true, sessionId: data.id };
  } catch {
    return { ok: false, error: "insert_failed" };
  }
}

export async function appendConsultMessage(input: {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<ActionState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    const data = await apiPost<{ id: string }>(
      `/consult/sessions/${input.sessionId}/messages`,
      {
        role: input.role,
        content: input.content,
        metadata: input.metadata,
      },
    );
    return { ok: true, messageId: data.id };
  } catch {
    return { ok: false, error: "insert_failed" };
  }
}

export async function renameConsultSession(input: {
  sessionId: string;
  title: string;
}): Promise<ActionState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    await apiPut(`/consult/sessions/${input.sessionId}`, {
      title: input.title,
    });
    revalidatePath("/app/consult");
    return { ok: true };
  } catch {
    return { ok: false, error: "update_failed" };
  }
}

export type SendConsultReason = "rate_limited" | "daily_token_cap";

export type SendConsultResult =
  | { ok: true; assistantMessageId: string; assistantContent: string }
  | { ok: false; error: string; reason?: SendConsultReason };

export async function sendConsultMessage(input: {
  sessionId: string;
  body: string;
}): Promise<SendConsultResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    const data = await apiPost<{
      assistantMessageId: string;
      assistantContent: string;
    }>("/consult/stream", {
      sessionId: input.sessionId,
      body: input.body,
    });
    revalidatePath("/app/consult");
    return {
      ok: true,
      assistantMessageId: data.assistantMessageId,
      assistantContent: data.assistantContent,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg.includes("429")) {
      return { ok: false, error: "rate_limited", reason: "rate_limited" };
    }
    return { ok: false, error: msg };
  }
}

export async function deleteConsultSession(
  sessionId: string
): Promise<ActionState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    await apiDelete(`/consult/sessions/${sessionId}`);
    revalidatePath("/app/consult");
    return { ok: true };
  } catch {
    return { ok: false, error: "delete_failed" };
  }
}
