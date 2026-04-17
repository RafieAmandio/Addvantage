import type { ConsultMessage } from "@/lib/mock/types";

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
