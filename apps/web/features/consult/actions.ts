"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { apiPost, apiPostForm, apiPut, apiDelete } from "@/lib/api/client-server";

interface ActionState {
  ok: boolean;
  error?: string;
  sessionId?: string;
  messageId?: string;
  imageUrl?: string;
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
  role: "user" | "admin";
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

export async function uploadConsultImage(
  sessionId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await getSession();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    const data = await apiPostForm<{ id: string; imageUrl: string }>(
      `/consult/sessions/${sessionId}/upload`,
      formData,
    );
    return { ok: true, messageId: data.id, imageUrl: data.imageUrl };
  } catch {
    return { ok: false, error: "upload_failed" };
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
