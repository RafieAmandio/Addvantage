import { z } from "zod";

export interface ConsultMessage {
  id: string;
  role: "user" | "ai" | "team";
  author?: string;
  ts: string;
  body: string;
  tags: string[];
}

export interface ConsultSession {
  id: string;
  title: string;
  startedAt: string;
  lastAt: string;
  messages: ConsultMessage[];
  tags: string[];
}

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

export const CONSULT_MESSAGE_ROLES = ["user", "assistant"] as const;
type ConsultMessageRole = (typeof CONSULT_MESSAGE_ROLES)[number];

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
