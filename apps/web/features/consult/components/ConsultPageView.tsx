"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { ConsultLayout } from "@/features/consult/components/ConsultLayout";
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
import { Panel } from "@/components/ui/Panel";
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

  const { draft, setDraft, send, sendImage, uploadingImage, exportActiveSession } = useConsultActions({
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
    sendImage,
    uploadingImage,
    endRef,
    onExportSession: exportActiveSession,
  };

  return (
    <div className="relative grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <ConsultModeHint modeHint={modeHint} />

      <div className="min-w-0">
        {!paid && (
          <div className="relative h-[70vh] overflow-hidden rounded-2xl">
            <div className="absolute inset-0 z-10">
              <PaywallOverlay
                surface="1v1 Consultation"
                reason="Private consultation with the founding desk is restricted to VIP+ Trader. Upgrade to open a session."
              />
            </div>
            <div className="pointer-events-none h-full select-none blur-sm">
              <ConsultLayout {...layoutProps} />
            </div>
          </div>
        )}
        {paid && <ConsultLayout {...layoutProps} />}
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel
          title="The desk"
          action={
            paid ? (
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-up">Available</span>
            ) : (
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-brand">VIP+</span>
            )
          }
        >
          <p className="text-[14px] leading-[21px] text-white/55">
            Private consultation with the founding desk. Trade reviews, second opinions, blind-spot checks.
          </p>
          <dl className="mt-4 divide-y divide-white/[0.07] border-t border-white/[0.07] text-[14px]">
            {[
              ["Response", "Within a few hours in session"],
              ["Sessions", "One per account"],
              ["Attachments", "Images, paste or upload"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-white/40">{k}</dt>
                <dd className="text-right text-white/75">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Get a better answer">
          <ul className="space-y-2 text-[14px] leading-[21px] text-white/55">
            <li>Include position size, entry and stop.</li>
            <li>Paste the chart you are looking at.</li>
            <li>Say what you are feeling about the trade.</li>
          </ul>
        </Panel>
      </aside>
    </div>
  );
}
