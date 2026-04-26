import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
  ConsultMessageRowSchema,
  ConsultSessionRowSchema,
  type ConsultMessageRow,
  type ConsultSessionRow,
} from "@/features/consult/types";

const SESSION_COLUMNS = "id,title,created_at,updated_at";
const MESSAGE_COLUMNS = "id,session_id,role,content,created_at";

export async function listConsultSessions(
  limit = 50
): Promise<ConsultSessionRow[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("consult_sessions")
    .select(SESSION_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("listConsultSessions failed", {
      error,
      scope: "consult.listConsultSessions",
    });
    return [];
  }

  const parsed = ConsultSessionRowSchema.array().safeParse(data ?? []);
  if (!parsed.success) {
    logger.error("listConsultSessions: shape mismatch", {
      issues: parsed.error.issues,
      scope: "consult.listConsultSessions",
    });
    return [];
  }

  return parsed.data;
}

const DEFAULT_MESSAGE_LIMIT = 200;

export async function listConsultMessages(
  sessionId: string,
  input: { limit?: number } = {}
): Promise<ConsultMessageRow[]> {
  const limit = input.limit ?? DEFAULT_MESSAGE_LIMIT;
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("consult_messages")
    .select(MESSAGE_COLUMNS)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("listConsultMessages failed", {
      error,
      sessionId,
      scope: "consult.listConsultMessages",
    });
    return [];
  }

  const parsed = ConsultMessageRowSchema.array().safeParse(data ?? []);
  if (!parsed.success) {
    logger.error("listConsultMessages: shape mismatch", {
      issues: parsed.error.issues,
      sessionId,
      scope: "consult.listConsultMessages",
    });
    return [];
  }

  return parsed.data.slice().reverse();
}
