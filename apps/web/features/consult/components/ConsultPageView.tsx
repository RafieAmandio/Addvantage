"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { consultSessions as mockSessions } from "@/features/consult/mock";
import { sessionMatchesQuery } from "@/features/consult/lib/search";
import { ConsultLayout } from "@/features/consult/components/ConsultLayout";
import { ConsultHeroHeader } from "@/features/consult/components/ConsultHeroHeader";
import { ConsultModeHint } from "@/features/consult/components/ConsultModeHint";
import {
  useConsultPersistence,
  type InitialConsultData,
} from "@/features/consult/hooks/useConsultPersistence";
import { useConsultKeyboard } from "@/features/consult/hooks/useConsultKeyboard";
import { useSessionQueryParam } from "@/features/consult/hooks/useSessionQueryParam";
import { useConsultActions } from "@/features/consult/hooks/useConsultActions";
import { useAppState, isPaid } from "@/lib/state";
import { PaywallOverlay } from "@/components/ui/Paywall";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ConsultSession } from "@/lib/mock/types";

export function ConsultPageView({
  initialData,
}: {
  initialData?: InitialConsultData;
}) {
  const { tier } = useAppState();
  const paid = isPaid(tier);

  const {
    localSessions,
    setLocalSessions,
    extrasBySession,
    setExtrasBySession,
    activeId,
    setActiveId,
  } = useConsultPersistence(initialData);

  const [sessionQuery, setSessionQuery] = useSessionQueryParam();
  const modeHint = useConsultKeyboard();
  const endRef = useRef<HTMLDivElement>(null);

  const allSessions: ConsultSession[] = useMemo(
    () => [
      ...localSessions.map((s) => ({
        ...s,
        tags: [] as never[],
      })) as unknown as ConsultSession[],
      ...mockSessions,
    ],
    [localSessions]
  );

  const visibleSessions: ConsultSession[] = useMemo(
    () =>
      allSessions.filter((s) =>
        sessionMatchesQuery(s, extrasBySession[s.id] ?? [], sessionQuery)
      ),
    [allSessions, extrasBySession, sessionQuery]
  );

  const active = allSessions.find((s) => s.id === activeId) ?? allSessions[0];
  const extras = extrasBySession[active.id] ?? [];
  const messages = [...active.messages, ...extras];

  const {
    draft,
    setDraft,
    typing,
    pendingDelete,
    setPendingDelete,
    startNewSession,
    send,
    renameSession,
    requestDeleteSession,
    confirmDeleteSession,
    exportActiveSession,
    isUserSession,
  } = useConsultActions({
    active,
    activeId,
    setActiveId,
    extrasBySession,
    setExtrasBySession,
    setLocalSessions,
  });

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [extras, typing]);

  const layoutProps = {
    sessions: visibleSessions,
    totalSessions: allSessions.length,
    sessionQuery,
    setSessionQuery,
    extrasBySession,
    messages,
    active,
    activeId,
    setActiveId,
    draft,
    setDraft,
    send,
    endRef,
    typing,
    onNewSession: startNewSession,
    onRenameSession: renameSession,
    onDeleteSession: requestDeleteSession,
    onExportSession: exportActiveSession,
    isLocalSession: isUserSession,
  };

  return (
    <div className="stagger relative">
      <ConsultModeHint modeHint={modeHint} />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete "${pendingDelete?.title ?? ""}"?`}
        description="This local session and all its messages will be permanently removed. Mock sessions from the desk are not affected."
        confirmLabel="Delete session"
        cancelLabel="Keep"
        destructive
        onConfirm={confirmDeleteSession}
        onCancel={() => setPendingDelete(null)}
      />
      <ConsultHeroHeader paid={paid} />

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        {!paid && (
          <div className="relative h-[60vh]">
            <PaywallOverlay
              surface="1v1 Consultation"
              reason="Private consultation with the AI and the desk is restricted to VIP+ Trader. Upgrade to open a session and have the desk review your trades."
            />
            <div className="pointer-events-none h-full select-none blur-sm">
              <ConsultLayout {...layoutProps} />
            </div>
          </div>
        )}
        {paid && <ConsultLayout {...layoutProps} />}
      </div>
    </div>
  );
}
