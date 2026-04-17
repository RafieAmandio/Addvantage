"use client";

import { useEffect, useState } from "react";
import { consultSessions as mockSessions } from "@/features/consult/mock";
import {
  CONSULT_STORAGE_KEY,
  type LocalSession,
  type PersistedConsult,
} from "@/features/consult/types";
import { useToast } from "@/lib/toast";
import type { ConsultMessage } from "@/lib/mock/types";

/**
 * Hydrates + persists consult sessions and message extras to localStorage.
 * Also restores the last active session with a one-shot toast flash.
 */
export function useConsultPersistence() {
  const toast = useToast();
  const [localSessions, setLocalSessions] = useState<LocalSession[]>([]);
  const [extrasBySession, setExtrasBySession] = useState<
    Record<string, ConsultMessage[]>
  >({});
  const [activeId, setActiveId] = useState(mockSessions[0].id);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSULT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedConsult;
        if (Array.isArray(parsed.sessions)) setLocalSessions(parsed.sessions);
        if (parsed.extras && typeof parsed.extras === "object") {
          setExtrasBySession(parsed.extras);
        }
        if (parsed.lastActiveId && parsed.lastActiveId !== mockSessions[0].id) {
          const fromMock = mockSessions.find(
            (s) => s.id === parsed.lastActiveId
          );
          const fromLocal = parsed.sessions?.find(
            (s) => s.id === parsed.lastActiveId
          );
          const resumed = fromMock ?? fromLocal;
          if (resumed) {
            setActiveId(parsed.lastActiveId);
            const RESTORE_SHOWN_KEY = "ants-domain-consult-restore-shown";
            let alreadyShown = false;
            try {
              alreadyShown =
                sessionStorage.getItem(RESTORE_SHOWN_KEY) === "1";
            } catch {}
            if (!alreadyShown) {
              try {
                sessionStorage.setItem(RESTORE_SHOWN_KEY, "1");
              } catch {}
              const defaultId = mockSessions[0].id;
              toast.push({
                tone: "info",
                title: "Resumed last session",
                description: `${resumed.id} · ${resumed.title}`,
                duration: 3500,
                action: {
                  label: "↶ START FRESH",
                  onClick: () => setActiveId(defaultId),
                },
              });
            }
          }
        }
      }
    } catch {}
    setHydrated(true);
    // toast is stable (noop when unmounted), safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on any change, after hydration
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
