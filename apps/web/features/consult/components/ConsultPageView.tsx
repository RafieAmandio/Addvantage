"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { ConsultLayout } from "@/features/consult/components/ConsultLayout";
import { ConsultHeroHeader } from "@/features/consult/components/ConsultHeroHeader";
import { ConsultModeHint } from "@/features/consult/components/ConsultModeHint";
import {
  useConsultPersistence,
  type InitialConsultData,
} from "@/features/consult/hooks/useConsultPersistence";
import { useConsultKeyboard } from "@/features/consult/hooks/useConsultKeyboard";
import { useConsultActions } from "@/features/consult/hooks/useConsultActions";
import { useConsultPolling } from "@/features/consult/hooks/useConsultPolling";
import { useAppState, isPaid } from "@/lib/state";
import { PaywallOverlay } from "@/components/ui/Paywall";
import type { ConsultSession } from "@/features/consult/types";

const EMPTY_SESSION: ConsultSession = {
  id: "",
  title: "",
  startedAt: "",
  lastAt: "",
  messages: [],
  tags: [],
};

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

  const modeHint = useConsultKeyboard();
  const endRef = useRef<HTMLDivElement>(null);

  // One session per account: always resolve to the single latest session.
  const active =
    localSessions.find((s) => s.id === activeId) ??
    localSessions[0] ??
    EMPTY_SESSION;
  const extras = extrasBySession[active.id] ?? [];
  const messages = [...active.messages, ...extras];

  const { draft, setDraft, send, exportActiveSession } = useConsultActions({
    active,
    activeId,
    setActiveId,
    extrasBySession,
    setExtrasBySession,
    setLocalSessions,
  });

  useConsultPolling({
    activeId,
    extrasBySession,
    setExtrasBySession,
    setLocalSessions,
    enabled: paid && !!activeId,
  });

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [extras]);

  const layoutProps = {
    messages,
    active,
    draft,
    setDraft,
    send,
    endRef,
    onExportSession: exportActiveSession,
  };

  return (
    <div className="stagger relative">
      <ConsultModeHint modeHint={modeHint} />
      <ConsultHeroHeader paid={paid} />

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        {!paid && (
          <div className="relative h-[60vh]">
            <PaywallOverlay
              surface="1v1 Consultation"
              reason="Private consultation with the founding desk is restricted to VIP+ Trader. Upgrade to open a session."
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
