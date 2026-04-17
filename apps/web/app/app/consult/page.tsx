"use client";

import { Suspense, useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { consultSessions as mockSessions } from "@/features/consult/mock";
import { sessionMatchesQuery } from "@/features/consult/lib/search";
import { pickReply } from "@/features/consult/lib/replies";
import { sessionToMarkdown } from "@/features/consult/lib/export";
import {
  CONSULT_STORAGE_KEY,
  type LocalSession,
  type PersistedConsult,
} from "@/features/consult/types";
import { useAppState, isPaid } from "@/lib/state";
import { DataLabel } from "@/components/ui/Marker";
import { PaywallOverlay } from "@/components/ui/Paywall";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/lib/toast";
import type { ConsultMessage, ConsultSession } from "@/lib/mock/types";
import { ConsultLayout } from "@/features/consult/components/ConsultLayout";

export default function ConsultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-lime">
            <span className="led lime" />
            OPENING CHANNEL
          </div>
        </div>
      }
    >
      <ConsultPageView />
    </Suspense>
  );
}

function ConsultPageView() {
  const { tier } = useAppState();
  const paid = isPaid(tier);
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local sessions + per-session message extras, persisted to localStorage.
  const [localSessions, setLocalSessions] = useState<LocalSession[]>([]);
  const [extrasBySession, setExtrasBySession] = useState<
    Record<string, ConsultMessage[]>
  >({});
  const [hydrated, setHydrated] = useState(false);

  const [activeId, setActiveId] = useState(mockSessions[0].id);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [modeHint, setModeHint] = useState<string | null>(null);
  const [sessionQuery, setSessionQuery] = useState<string>(
    () => searchParams.get("sq")?.trim() ?? ""
  );
  const endRef = useRef<HTMLDivElement>(null);

  // Persist session filter to URL (?sq=...)
  useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString());
    if (sessionQuery) {
      sp.set("sq", sessionQuery);
    } else {
      sp.delete("sq");
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // searchParams is fetched once via initial state; intentionally not a dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionQuery, pathname, router]);

  // Hydrate persisted state once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSULT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedConsult;
        if (Array.isArray(parsed.sessions)) setLocalSessions(parsed.sessions);
        if (parsed.extras && typeof parsed.extras === "object") {
          setExtrasBySession(parsed.extras);
        }
        // Restore the last active session, but only if it still exists
        // (local sessions could have been deleted externally, mock sessions
        // are always present). Flash a small toast so the user knows the
        // restore happened — but only ONCE per browser session (sessionStorage
        // flag). Navigating back and forth shouldn't re-flash.
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

  // Combined session list for the sidebar: local first (newest), then mocks.
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

  // Filter by session search query — matches id, title, tags, message bodies
  const visibleSessions: ConsultSession[] = useMemo(
    () =>
      allSessions.filter((s) =>
        sessionMatchesQuery(s, extrasBySession[s.id] ?? [], sessionQuery)
      ),
    [allSessions, extrasBySession, sessionQuery]
  );

  const active =
    allSessions.find((s) => s.id === activeId) ?? allSessions[0];

  const extras = extrasBySession[active.id] ?? [];
  const messages = [...active.messages, ...extras];

  // Instant snap to bottom on session swap (before paint, no race)
  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [activeId]);

  // Smooth scroll for new messages and typing indicator in active session
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [extras, typing]);

  // `i` focuses the message input — vim-style insert mode, only fires
  // when the operator isn't already typing somewhere else. Also scrolls
  // the input into view in case the user was reading far up the thread.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "i") return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      const input = document.querySelector<HTMLTextAreaElement>(
        "[data-consult-input]"
      );
      if (input) {
        e.preventDefault();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        // Focus *after* the scroll so the browser doesn't double-scroll
        requestAnimationFrame(() => input.focus());
        setModeHint("INSERT");
        setTimeout(() => setModeHint(null), 900);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Listen for Escape blur events from the textarea itself so we can
  // show a normal-mode hint. Dispatched by the textarea onKeyDown below.
  useEffect(() => {
    const onNormal = () => {
      setModeHint("NORMAL");
      setTimeout(() => setModeHint(null), 900);
    };
    window.addEventListener("ants:consult-normal-mode", onNormal);
    return () => window.removeEventListener("ants:consult-normal-mode", onNormal);
  }, []);

  const startNewSession = () => {
    const now = new Date();
    const hhmm =
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0");
    const id = `CS-LOC-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const session: LocalSession = {
      id,
      title: `New session · ${hhmm}`,
      startedAt: now.toISOString(),
      lastAt: now.toISOString(),
      tags: [],
      messages: [],
    };
    setLocalSessions((prev) => [session, ...prev]);
    setActiveId(id);
    setDraft("");
    toast.push({
      tone: "success",
      title: "Session opened",
      description: `${id} · awaiting first transmission. Rename via the ✎ icon.`,
    });
  };

  const send = () => {
    if (!draft.trim()) return;
    const sessionId = active.id;
    const nowIso = new Date().toISOString();
    const userMsg: ConsultMessage = {
      id: `M-x${Date.now()}`,
      role: "user",
      ts: nowIso,
      body: draft,
      tags: [],
    };

    // How many user messages are already in this session? Use that to pick
    // a stable reply variant so replays look the same.
    const priorUserCount = [
      ...(active.messages ?? []),
      ...(extrasBySession[sessionId] ?? []),
    ].filter((m) => m.role === "user").length;

    setExtrasBySession((prev) => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] ?? []), userMsg],
    }));
    // Bump lastAt on the owning local session if this is a user-created one
    setLocalSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, lastAt: nowIso } : s))
    );

    const userBody = draft;
    setDraft("");
    setTyping(true);
    setTimeout(() => {
      const variant = pickReply(userBody, priorUserCount);
      const replyMsg: ConsultMessage = {
        id: `M-x${Date.now() + 1}`,
        role: "ai",
        ts: new Date().toISOString(),
        body: variant.body,
        tags: variant.tags,
      };
      setExtrasBySession((prev) => ({
        ...prev,
        [sessionId]: [...(prev[sessionId] ?? []), replyMsg],
      }));
      setLocalSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, lastAt: new Date().toISOString() }
            : s
        )
      );
      setTyping(false);
    }, 1400);
  };

  const renameSession = (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (trimmed.length === 0) return;
    setLocalSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: trimmed } : s))
    );
    toast.push({
      tone: "info",
      title: "Session renamed",
      description: trimmed,
      duration: 2500,
    });
  };

  const requestDeleteSession = (id: string, title: string) => {
    if (!id.startsWith("CS-LOC-")) return;
    setPendingDelete({ id, title });
  };

  const exportActiveSession = async () => {
    const md = sessionToMarkdown(
      active,
      extrasBySession[active.id] ?? []
    );
    try {
      await navigator.clipboard.writeText(md);
      toast.push({
        tone: "success",
        title: "Session exported",
        description: `${active.id} · ${active.messages.length + (extrasBySession[active.id]?.length ?? 0)} messages · on your clipboard.`,
      });
    } catch {
      toast.push({
        tone: "error",
        title: "Export failed",
        description: "Browser denied clipboard access.",
      });
    }
  };

  const confirmDeleteSession = () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    const title = pendingDelete.title;
    setLocalSessions((prev) => prev.filter((s) => s.id !== id));
    setExtrasBySession((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // If the deleted session was active, fall back to the default mock.
    // This drives the persist effect, which re-writes lastActiveId to the
    // new value — no stale pointer in localStorage.
    if (activeId === id) setActiveId(mockSessions[0].id);
    setPendingDelete(null);
    toast.push({
      tone: "warn",
      title: "Session deleted",
      description: `"${title}" removed from the desk. This cannot be undone.`,
    });
  };

  return (
    <div className="relative">
      {/* Mode hint — always rendered (empty when idle) so screen readers
          can subscribe to live updates from the start. */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {modeHint ? `${modeHint} mode` : ""}
      </div>
      {modeHint && (
        <div
          aria-hidden
          className="pointer-events-none fixed left-1/2 z-[60] -translate-x-1/2 border border-lime bg-ink-2 px-4 py-2 font-mono text-[11px] uppercase tracking-widest2 text-lime shadow-[0_0_30px_rgba(245,158,11,0.3)] top-6 sm:bottom-6 sm:top-auto"
        >
          ● {modeHint}
        </div>
      )}
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
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <DataLabel>Transmission TX-04 · Restricted</DataLabel>
              <h1 className="mt-2 font-display text-5xl text-paper">
                1v1 <span className="italic text-lime">Consultation</span>
              </h1>
              <p className="mt-2 max-w-2xl font-display text-base text-paper/60">
                Private chat with the AI and the desk. Trade reviews. Second
                opinions. Blind-spot checks. Tagged into the same hashtag
                system as everything else.
              </p>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest2">
              <div className={paid ? "text-moss" : "text-blood"}>
                ● {paid ? "SESSION OPEN" : "ACCESS DENIED"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {!paid && (
          <div className="relative h-[60vh]">
            <PaywallOverlay
              surface="1v1 Consultation"
              reason="Private consultation with the AI and the desk is restricted to VIP+ Trader. Upgrade to open a session and have the desk review your trades."
            />
            <div className="pointer-events-none h-full select-none blur-sm">
              <ConsultLayout
                sessions={visibleSessions}
                totalSessions={allSessions.length}
                sessionQuery={sessionQuery}
                setSessionQuery={setSessionQuery}
                extrasBySession={extrasBySession}
                messages={messages}
                active={active}
                activeId={activeId}
                setActiveId={setActiveId}
                draft={draft}
                setDraft={setDraft}
                send={send}
                endRef={endRef}
                typing={typing}
                onNewSession={startNewSession}
                onRenameSession={renameSession}
                onDeleteSession={requestDeleteSession}
                onExportSession={exportActiveSession}
              />
            </div>
          </div>
        )}
        {paid && (
          <ConsultLayout
            sessions={visibleSessions}
            totalSessions={allSessions.length}
            sessionQuery={sessionQuery}
            setSessionQuery={setSessionQuery}
            extrasBySession={extrasBySession}
            messages={messages}
            active={active}
            activeId={activeId}
            setActiveId={setActiveId}
            draft={draft}
            setDraft={setDraft}
            send={send}
            endRef={endRef}
            typing={typing}
            onNewSession={startNewSession}
            onRenameSession={renameSession}
            onDeleteSession={requestDeleteSession}
            onExportSession={exportActiveSession}
          />
        )}
      </div>
    </div>
  );
}
