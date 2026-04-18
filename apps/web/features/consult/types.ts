import { z } from "zod";
import type { ConsultMessage } from "@/lib/mock/types";

// ---------------------------------------------------------------------------
// LocalStorage-persisted shapes (leftover from the mock prototype; the
// localStorage cache still runs alongside Supabase as an offline fallback).
// ---------------------------------------------------------------------------

export interface LocalSession {
  id: string;
  title: string;
  startedAt: string;
  lastAt: string;
  tags: [];
  messages: ConsultMessage[];
}

export interface PersistedConsult {
  sessions: LocalSession[];
  extras: Record<string, ConsultMessage[]>;
  lastActiveId?: string;
}

export const CONSULT_STORAGE_KEY = "ants-domain-consult-v1";

// ---------------------------------------------------------------------------
// Supabase-backed shapes. Stored in `public.consult_sessions` + `public.
// consult_messages` (migration 0019). Zod schemas live here so both server
// queries and client components can import them without dragging
// supabaseServer/next/headers into the client bundle (see tick-91 learning).
// ---------------------------------------------------------------------------

export const CONSULT_MESSAGE_ROLES = ["user", "assistant"] as const;
export type ConsultMessageRole = (typeof CONSULT_MESSAGE_ROLES)[number];

export const ConsultSessionRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ConsultSessionRow = z.infer<typeof ConsultSessionRowSchema>;

export const ConsultMessageRowSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  role: z.enum(CONSULT_MESSAGE_ROLES),
  content: z.string(),
  created_at: z.string(),
});
export type ConsultMessageRow = z.infer<typeof ConsultMessageRowSchema>;
