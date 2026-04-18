"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type ToastTone = "info" | "success" | "warn" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  ts: number;
  duration: number;
  action?: ToastAction;
}

interface ToastApi {
  push: (
    input: Omit<Toast, "id" | "ts" | "duration"> & { duration?: number }
  ) => void;
  dismiss: (id: number) => void;
}

const Ctx = createContext<ToastApi | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback<ToastApi["push"]>(
    (input) => {
      const id = nextId++;
      const duration = input.duration ?? 3500;
      const toast: Toast = {
        id,
        ts: Date.now(),
        duration,
        tone: input.tone,
        title: input.title,
        description: input.description,
        action: input.action,
      };
      setToasts((prev) => [...prev, toast]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    // Snapshot the ref at effect-setup time: the ref value could change
    // before cleanup runs, and the cleanup should only clear the timers
    // that existed when this effect was registered.
    const timersMap = timers.current;
    return () => {
      timersMap.forEach((t) => clearTimeout(t));
      timersMap.clear();
    };
  }, []);

  return (
    <Ctx.Provider value={{ push, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) {
    // Fail-soft: return a noop. Lets non-app pages call useToast safely.
    return { push: () => {}, dismiss: () => {} } satisfies ToastApi;
  }
  return v;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  // Always render the region so screen readers can subscribe to live updates
  // even before the first toast arrives.
  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[95] flex max-w-sm flex-col items-end gap-2"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

const TONE_STYLES: Record<
  ToastTone,
  { border: string; bar: string; led: string; text: string }
> = {
  info: {
    border: "border-lime/50",
    bar: "bg-lime",
    led: "lime",
    text: "text-lime",
  },
  success: {
    border: "border-moss/60",
    bar: "bg-moss",
    led: "",
    text: "text-moss",
  },
  warn: {
    border: "border-lime",
    bar: "bg-lime-dim",
    led: "lime",
    text: "text-lime",
  },
  error: {
    border: "border-blood/70",
    bar: "bg-blood",
    led: "red",
    text: "text-[#fda4af]",
  },
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const styles = TONE_STYLES[toast.tone];
  return (
    <div
      className={`pointer-events-auto relative w-full border ${styles.border} bg-ink-2 shadow-[0_0_30px_rgba(245,158,11,0.18)]`}
      role="status"
    >
      {/* Top accent bar */}
      <div className={`h-0.5 w-full ${styles.bar}`} />

      <div className="flex items-start gap-3 px-4 py-3">
        <span className={`led mt-1 ${styles.led}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <div
            className={`font-mono text-[10px] uppercase tracking-widest2 ${styles.text}`}
          >
            ● {toast.tone === "success" ? "ACK" : toast.tone === "error" ? "DENIED" : toast.tone === "warn" ? "WARN" : "INFO"}
          </div>
          <div className="mt-1 font-display text-base text-paper">
            {toast.title}
          </div>
          {toast.description && (
            <div className="mt-1 text-xs text-paper/60">{toast.description}</div>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                onDismiss();
              }}
              className="mt-2 border border-lime/60 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="border border-ink-3 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/40 hover:border-lime hover:text-lime"
        >
          ✕
        </button>
      </div>

      {/* Auto-dismiss progress bar — keyframes live in globals.css */}
      <div className="h-px w-full bg-ink-3">
        <div
          className={`h-full ${styles.bar}`}
          style={{
            animation: `toastBar ${toast.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}
