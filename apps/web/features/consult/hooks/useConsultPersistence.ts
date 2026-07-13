"use client";

import { useEffect, useState } from "react";
import {
  CONSULT_STORAGE_KEY,
  type ConsultMessage,
  type LocalSession,
  type PersistedConsult,
} from "@/features/consult/types";

export interface InitialConsultData {
  sessions: LocalSession[];
  extras: Record<string, ConsultMessage[]>;
}

const EMPTY_INITIAL: InitialConsultData = { sessions: [], extras: {} };

export function useConsultPersistence(
  initial: InitialConsultData = EMPTY_INITIAL
) {
  const [localSessions, setLocalSessions] = useState<LocalSession[]>(
    initial.sessions
  );
  const [extrasBySession, setExtrasBySession] = useState<
    Record<string, ConsultMessage[]>
  >(initial.extras);
  const [activeId, setActiveId] = useState(
    initial.sessions[0]?.id ?? ""
  );
  const [hydrated, setHydrated] = useState(false);

  // One session per account: never resurface older/extra sessions from
  // localStorage. Always resolve to the single latest server session
  // provided in `initial`. localStorage is still written below purely as a
  // cache of the active session, but it is never merged back onto the list.
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        CONSULT_STORAGE_KEY,
        JSON.stringify({
          sessions: localSessions,
          extras: extrasBySession,
          lastActiveId: activeId,
        } satisfies PersistedConsult)
      );
    } catch {}
  }, [localSessions, extrasBySession, activeId, hydrated]);

  return {
    localSessions,
    setLocalSessions,
    extrasBySession,
    setExtrasBySession,
    activeId,
    setActiveId,
    hydrated,
  };
}
