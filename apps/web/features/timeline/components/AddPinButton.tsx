"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import {
  createUserPin,
  type PinActionState,
} from "@/features/timeline/actions";

const INITIAL_STATE: PinActionState = { ok: false };

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Sign in to pin events.",
  rate_limited: "Too many pins in the last minute. Slow down.",
  insert_failed: "Something went wrong. Try again.",
  invalid: "Check the form fields.",
  "title required": "Title is required.",
  "invalid occurredAt": "Pick a valid date/time.",
};

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-brand bg-brand px-5 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
    >
      {pending ? "Pinning…" : "Pin event →"}
    </button>
  );
}

interface AddPinButtonProps {
  symbol: string;
}

export function AddPinButton({ symbol }: AddPinButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createUserPin, INITIAL_STATE);
  const [flash, setFlash] = useState<string | null>(null);
  const [localDt, setLocalDt] = useState<string>(() =>
    toLocalInputValue(new Date()),
  );
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) setLocalDt(toLocalInputValue(new Date()));
  }, [open]);

  // datetime-local gives no offset; server action needs full ISO — convert via Date.
  const occurredAtIso = useMemo(() => {
    if (!localDt) return "";
    const d = new Date(localDt);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [localDt]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => titleInputRef.current?.focus(), 10);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, close]);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      setFlash("Pin added ✓");
      const t = setTimeout(() => setFlash(null), 2500);
      return () => clearTimeout(t);
    }
  }, [state.ok]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-gray-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
      >
        + Pin event
      </button>

      {flash ? (
        <div
          role="status"
          className="pointer-events-none fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 border border-brand bg-gray-2 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-brand shadow-[0_0_40px_rgba(255,212,0,0.25)]"
        >
          {flash}
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-pin-title"
        >
          <div
            onClick={close}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            aria-hidden
          />
          <div className="relative w-full max-w-lg border border-brand bg-gray-2 shadow-[0_0_60px_rgba(255,212,0,0.18)]">
            <div className="classification-stripe absolute -top-1 left-0 right-0 h-1" />
            <div className="border-b border-gray-3 p-5">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                ● PIN EVENT · {symbol}
              </div>
              <h3
                id="add-pin-title"
                className="mt-2 font-display text-2xl leading-tight text-white"
              >
                Mark a moment on the chart
              </h3>
              <p className="mt-2 text-sm text-white/60">
                Only you will see this pin. It renders as a grey marker below
                the price candles.
              </p>
            </div>

            <form action={formAction} className="space-y-4 p-5">
              <input type="hidden" name="symbol" value={symbol} />

              <div>
                <label
                  htmlFor="pin-title"
                  className="block font-mono text-[10px] uppercase tracking-widest2 text-white/40"
                >
                  Title *
                </label>
                <input
                  ref={titleInputRef}
                  id="pin-title"
                  name="title"
                  type="text"
                  required
                  maxLength={200}
                  className="mt-2 w-full border border-gray-3 bg-black px-3 py-2 font-mono text-sm text-white outline-none transition-colors focus-visible:border-brand"
                />
              </div>

              <div>
                <label
                  htmlFor="pin-body"
                  className="block font-mono text-[10px] uppercase tracking-widest2 text-white/40"
                >
                  Notes <span className="text-white/30">(optional)</span>
                </label>
                <textarea
                  id="pin-body"
                  name="body"
                  rows={4}
                  maxLength={2000}
                  className="mt-2 w-full resize-none border border-gray-3 bg-black px-3 py-2 font-mono text-sm text-white outline-none transition-colors focus-visible:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                    Symbol
                  </label>
                  <div className="mt-2 border border-gray-3 bg-black/60 px-3 py-2 font-mono text-sm text-white/70">
                    {symbol}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="pin-occurred-at"
                    className="block font-mono text-[10px] uppercase tracking-widest2 text-white/40"
                  >
                    Occurred at *
                  </label>
                  <input
                    id="pin-occurred-at"
                    type="datetime-local"
                    required
                    value={localDt}
                    onChange={(e) => setLocalDt(e.currentTarget.value)}
                    className="mt-2 w-full border border-gray-3 bg-black px-3 py-2 font-mono text-sm text-white outline-none transition-colors focus-visible:border-brand"
                  />
                  <input type="hidden" name="occurredAt" value={occurredAtIso} />
                </div>
              </div>

              {state.error ? (
                <div
                  role="alert"
                  className="border border-blood/60 bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-text"
                >
                  {ERROR_MESSAGES[state.error] ?? state.error}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className={cn(
                    "border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60",
                    "transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
                  )}
                >
                  Cancel · esc
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
