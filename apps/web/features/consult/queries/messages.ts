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

/**
 * Returns the authenticated user's consult sessions ordered by most-recent
 * activity. Returns `[]` on any error (also returned when unauthenticated
 * since RLS filters the read). Caller slices to a viewport.
 */
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

/**
 * Returns the last `limit` messages for a session in chronological order. RLS
 * ensures only the owner can read; unauthenticated / foreign-session reads
 * return []. We fetch newest-first then reverse in-memory so long-running
 * sessions don't balloon the payload or the LLM history window.
 */
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
