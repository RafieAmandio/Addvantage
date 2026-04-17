"use client";

import { Suspense, useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { consultSessions as mockSessions } from "@/lib/mock/consultations";
import { useAppState, isPaid } from "@/lib/state";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { PaywallOverlay } from "@/components/ui/Paywall";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { useToast } from "@/lib/toast";
import { formatDate, formatTime, cn } from "@/lib/cn";
import type { ConsultMessage, ConsultSession } from "@/lib/mock/types";

function sessionMatchesQuery(
  s: ConsultSession,
  extras: ConsultMessage[],
  q: string
): boolean {
  if (!q) return true;
  const allMessages = [...s.messages, ...extras];
  const haystack = [
    s.id,
    s.title,
    ...s.tags,
    ...allMessages.map((m) => m.body),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

interface LocalSession {
  id: string;
  title: string;
  startedAt: string;
  lastAt: string;
  tags: [];
  messages: ConsultMessage[];
}

interface PersistedConsult {
  sessions: LocalSession[];
  extras: Record<string, ConsultMessage[]>;
  lastActiveId?: string;
}

const CONSULT_STORAGE_KEY = "ants-domain-consult-v1";

// Eight small variants so canned AI replies don't all read identically.
// Picked deterministically by message count so replays feel stable.
const CANNED_REPLIES: Array<{ body: string; tags: ConsultMessage["tags"] }> = [
  {
    body: "Acknowledged. What's the current state of your position size relative to your account, and what's your hard invalidation level? Without those two numbers I can't give you a directional answer, only a process answer.",
    tags: ["risk-management"],
  },
  {
    body: "Before we go further — is the setup the one you pre-committed to, or are you trying to justify entering something that didn't fit the plan? Trading is the only profession where 'I changed my mind' costs you money every time.",
    tags: ["developing-edge", "loss-aversion"],
  },
  {
    body: "The feeling you're describing is loss aversion talking. That doesn't make it wrong — it means your nervous system is telling you something real. The question is whether that something is 'the trade is broken' or 'I'm in drawdown and I'm shaken'. Those require opposite actions.",
    tags: ["loss-aversion", "losing-streak"],
  },
  {
    body: "Write down the three things that have to be true for this trade to still be valid in 4 hours. If any of them changes, the plan isn't 'hold and hope', the plan is 'exit'. Pre-commit now while you can think clearly.",
    tags: ["risk-management"],
  },
  {
    body: "I want to separate two questions: (1) is this a good setup in isolation, and (2) is it a good setup FOR YOU, given your current state? They often have different answers. Drawdown changes the answer to #2 even when #1 hasn't moved.",
    tags: ["risk-management", "losing-streak"],
  },
  {
    body: "That's variance, not a signal yet. 22 trades is below the threshold where win rate stabilises. Track your distribution — are wins 2x losses, or are they equal? The R:R matters more than the hit rate at small samples.",
    tags: ["developing-edge", "recency-bias"],
  },
  {
    body: "Stop. Read primer P-001 (Loss Aversion) before you do anything else. The impulse you're having right now has a name, and it's the same impulse that has cost every trader on the desk more money than they want to admit. Name it and you can work around it.",
    tags: ["loss-aversion", "sunk-cost"],
  },
  {
    body: "The tape is noise until you have a hypothesis. What's the hypothesis? One sentence. If you can't state it cleanly, you don't have a trade, you have a vibe — and vibes don't have edge.",
    tags: ["developing-edge", "unprofitability"],
  },
];

// Keyword → which CANNED_REPLIES indices are good fits.
// First match wins; falls back to count-based cycling.
const REPLY_KEYWORDS: Array<{ pattern: RegExp; replies: number[] }> = [
  { pattern: /\b(size|sizing|position|risk|stop|invalidat)/i, replies: [0, 3, 4] },
  { pattern: /\b(loss|losing|drawdown|down|hurt|pain|red|underwater)/i, replies: [2, 6, 4] },
  { pattern: /\b(edge|setup|hypothesis|system|sample|win\s*rate|hit\s*rate)/i, replies: [5, 7, 1] },
  { pattern: /\b(scared|nervous|fear|anxious|fomo|euphori|greed|cocky)/i, replies: [2, 6] },
  { pattern: /\b(should\s*i|am\s*i|right|wrong|opinion|review)/i, replies: [1, 4] },
  { pattern: /\b(plan|trade|entry|target|exit)/i, replies: [3, 1] },
];

function pickReply(userMessage: string, fallbackIdx: number) {
  for (const { pattern, replies } of REPLY_KEYWORDS) {
    if (pattern.test(userMessage)) {
      // Within the matched bucket, rotate by fallback to avoid sticking
      return CANNED_REPLIES[replies[fallbackIdx % replies.length]];
    }
  }
  return CANNED_REPLIES[fallbackIdx % CANNED_REPLIES.length];
}

function sessionToMarkdown(
  session: ConsultSession,
  extras: ConsultMessage[]
): string {
  const allMessages = [...session.messages, ...extras];
  const lines: string[] = [
    `# ${session.title}`,
    ``,
    `**Session ID:** ${session.id}`,
    `**Started:** ${new Date(session.startedAt).toUTCString()}`,
    `**Messages:** ${allMessages.length}`,
  ];
  if (session.tags.length > 0) {
    lines.push(`**Tags:** ${session.tags.map((t) => `#${t}`).join(", ")}`);
  }
  lines.push(``, `---`, ``);

  for (const m of allMessages) {
    const who =
      m.role === "user"
        ? "Operator"
        : m.role === "ai"
        ? "ANTS · AI"
        : `Desk · ${m.author ?? "Team"}`;
    const ts = new Date(m.ts).toUTCString();
    lines.push(`### ${who} · ${ts}`);
    lines.push(``);
    lines.push(m.body);
    // Only render the tags blockquote if the message actually has tags.
    // Empty `> Tags:` lines looked like a bug in the exported markdown.
    if (m.tags && m.tags.length > 0) {
      lines.push(``);
      lines.push(`> Tags: ${m.tags.map((t) => `#${t}`).join(", ")}`);
    }
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`*Exported from ANTS // DOMAIN · ${session.id}*`);
  return lines.join("\n");
}

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

function ScrollableConversation({
  children,
  bottomRef,
  typing,
  messages,
}: {
  children: React.ReactNode;
  bottomRef: React.RefObject<HTMLDivElement>;
  typing: boolean;
  messages: ConsultMessage[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollTop(el.scrollTop > 200);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages.length, typing]);

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        className="h-full space-y-4 overflow-y-auto bg-ink p-5"
      >
        {children}
      </div>
      {showScrollTop && (
        <button
          onClick={() => {
            containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Scroll to top of conversation"
          title="Back to top"
          className="absolute right-4 top-4 z-10 flex items-center gap-2 border border-lime/60 bg-ink-2 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-lime shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:bg-lime hover:text-ink"
        >
          <span aria-hidden>↑</span>
          TOP
        </button>
      )}
    </div>
  );
}

function ConsultLayout({
  sessions,
  totalSessions,
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
  onNewSession,
  onRenameSession,
  onDeleteSession,
  onExportSession,
}: {
  sessions: ConsultSession[];
  totalSessions: number;
  sessionQuery: string;
  setSessionQuery: (q: string) => void;
  extrasBySession: Record<string, ConsultMessage[]>;
  messages: ConsultMessage[];
  active: ConsultSession;
  activeId: string;
  setActiveId: (id: string) => void;
  draft: string;
  setDraft: (s: string) => void;
  send: () => void;
  endRef: React.RefObject<HTMLDivElement>;
  typing: boolean;
  onNewSession: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string, title: string) => void;
  onExportSession: () => void;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Sessions sidebar */}
      <aside className="col-span-12 lg:col-span-3">
        <div className="flex items-center justify-between">
          <SectionNumber
            n="—"
            label={
              sessionQuery
                ? `${sessions.length} / ${totalSessions} SESSIONS`
                : `SESSIONS · ${totalSessions}`
            }
          />
        </div>
        <div className="mt-3">
          <PageSearchInput
            value={sessionQuery}
            onChange={setSessionQuery}
            placeholder="Filter sessions…   (s to focus)"
            ariaLabel="Search sessions"
            matchLabel={
              sessionQuery
                ? `${sessions.length} ${sessions.length === 1 ? "MATCH" : "MATCHES"}`
                : null
            }
          />
        </div>
        <button
          onClick={onNewSession}
          className="mt-3 flex w-full items-center justify-center gap-2 border border-lime bg-lime/5 py-2 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
        >
          <span className="text-base leading-none">+</span>
          New session
        </button>
        {sessions.length === 0 && (
          <div className="mt-3 border border-ink-3 bg-ink p-4 text-center">
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-blood">
              ● NO MATCHES
            </div>
            <div className="mt-1 font-mono text-[10px] text-paper/50">
              No sessions match "{sessionQuery}".
            </div>
            <button
              onClick={() => setSessionQuery("")}
              className="mt-3 border border-lime/60 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
            >
              ✕ Clear
            </button>
          </div>
        )}
        <div className="mt-3 space-y-px bg-ink-3">
          {sessions.map((s) => {
            const msgCount =
              s.messages.length + (extrasBySession[s.id]?.length ?? 0);
            const isLocal = s.id.startsWith("CS-LOC-");
            const isRenaming = renamingId === s.id;
            return (
              <div
                key={s.id}
                className={cn(
                  "group relative bg-ink transition-colors hover:bg-ink-2",
                  s.id === activeId && "border-l-2 border-lime bg-ink-2"
                )}
              >
                <button
                  onClick={() => !isRenaming && setActiveId(s.id)}
                  className="block w-full p-3 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[9px] uppercase tracking-widest2 text-lime">
                      {s.id}
                    </div>
                    {isLocal && (
                      <span className="font-mono text-[8px] uppercase tracking-widest2 text-moss">
                        ● LOCAL
                      </span>
                    )}
                  </div>
                  {isRenaming ? (
                    <input
                      autoFocus
                      defaultValue={s.title}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        onRenameSession(s.id, e.target.value);
                        setRenamingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onRenameSession(
                            s.id,
                            (e.target as HTMLInputElement).value
                          );
                          setRenamingId(null);
                        }
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="mt-1 w-full border-b border-lime bg-transparent py-0.5 font-display text-sm text-lime outline-none"
                    />
                  ) : (
                    <div className="mt-1 text-sm text-paper">{s.title}</div>
                  )}
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                    {formatDate(s.lastAt)} · {msgCount} msgs
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[9px] uppercase tracking-widest2 text-lime/60"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </button>

                {isLocal && !isRenaming && (
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(s.id);
                      }}
                      title="Rename session"
                      className="border border-ink-3 bg-ink-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/50 hover:border-lime hover:text-lime"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(s.id, s.title);
                      }}
                      title="Delete session"
                      className="border border-ink-3 bg-ink-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/50 hover:border-blood hover:text-blood"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Conversation */}
      <section className="col-span-12 flex h-[75vh] flex-col border border-ink-3 lg:col-span-9">
        <div className="border-b border-ink-3 bg-ink-2/40 px-5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                {active.id}
              </div>
              <div className="mt-1 font-display text-lg text-paper">
                {active.title}
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {active.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[9px] uppercase tracking-widest2 text-lime/60"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={onExportSession}
              title="Copy this session as markdown"
              aria-label="Export session as markdown"
              className="shrink-0 border border-ink-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/60 hover:border-lime hover:text-lime"
            >
              ⇩ EXPORT MD
            </button>
          </div>
        </div>

        <ScrollableConversation
          bottomRef={endRef}
          typing={typing}
          messages={messages}
        >
          {messages.length === 0 && !typing && (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                ● SESSION OPEN · AWAITING FIRST TRANSMISSION
              </div>
              <div className="mt-4 max-w-sm font-display text-xl italic text-paper/70">
                The desk is standing by. Describe your situation — position
                size, entry, stop, and what you're feeling about it.
              </div>
              <div className="mt-4 font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
                Transmission is one-way until you send the first message.
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}
          {typing && <TypingIndicator />}
          <div ref={endRef} />
        </ScrollableConversation>

        <div className="border-t border-ink-3 bg-ink-2/40 p-4">
          <div className="flex items-end gap-3">
            <textarea
              data-consult-input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                } else if (e.key === "Escape") {
                  // Vim-style normal mode — blur back to shortcut layer
                  e.preventDefault();
                  (e.target as HTMLTextAreaElement).blur();
                  window.dispatchEvent(
                    new CustomEvent("ants:consult-normal-mode")
                  );
                }
              }}
              rows={2}
              placeholder="Describe your situation. Include position size, entry, stop, and what you're feeling about it…  (press i to focus, esc to blur)"
              className="flex-1 resize-none border border-ink-3 bg-ink p-3 font-mono text-sm text-paper placeholder:text-paper/30 outline-none focus:border-lime"
            />
            <button
              onClick={send}
              className="bg-lime px-5 py-3 font-mono text-[10px] uppercase tracking-widest2 text-ink hover:bg-lime-dim hover:text-paper"
            >
              Transmit →
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
            <span>● Encrypted · ANTS-internal · Session-only</span>
            <span>Enter to send · Shift+Enter for newline</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-moss">
          ● ANTS · AI
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
          PROCESSING…
        </span>
      </div>
      <div className="mt-1 inline-flex items-center gap-2 border border-ink-3 bg-ink-2 px-4 py-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-moss [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-moss [animation-delay:200ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-moss [animation-delay:400ms]" />
        <span className="ml-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
          DESK · TYPING
        </span>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: ConsultMessage }) {
  const isUser = msg.role === "user";
  const isAi = msg.role === "ai";
  const align = isUser ? "items-end" : "items-start";
  const tagColor = isUser
    ? "text-lime"
    : isAi
    ? "text-moss"
    : "text-paper";
  const bg = isUser
    ? "bg-lime/10 border-lime/40"
    : isAi
    ? "bg-ink-2 border-ink-3"
    : "bg-ink-2 border-lime/40";

  return (
    <div className={`flex flex-col ${align}`}>
      <div className="flex items-center gap-2">
        <span
          className={`font-mono text-[9px] uppercase tracking-widest2 ${tagColor}`}
        >
          ● {isUser ? "OPERATOR" : isAi ? "ANTS · AI" : `DESK · ${msg.author ?? "TEAM"}`}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
          {formatTime(msg.ts)}Z
        </span>
      </div>
      <div
        className={`mt-1 max-w-[80%] whitespace-pre-line border ${bg} p-4 text-sm leading-relaxed text-paper/90`}
      >
        {msg.body}
      </div>
      {msg.tags.length > 0 && (
        <div className="mt-1 flex gap-2">
          {msg.tags.map((t) => (
            <span
              key={t}
              className="font-mono text-[9px] uppercase tracking-widest2 text-lime/60"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
