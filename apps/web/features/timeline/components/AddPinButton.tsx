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

/**
 * Converts a `Date` into the `YYYY-MM-DDTHH:MM` local-time string that
 * `<input type="datetime-local">` expects. Avoids the UTC offset that
 * `Date#toISOString()` would introduce.
 */
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
      className="border border-lime bg-lime px-5 py-2 font-mono text-[10px] uppercase tracking-widest2 text-ink transition-colors hover:bg-brand-dim hover:text-paper disabled:opacity-50"
    >
      {pending ? "Pinning…" : "Pin event →"}
    </button>
  );
}

export interface AddPinButtonProps {
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

  // Reset the datetime to "now" each time the modal opens so a stale closure
  // doesn't leak a time from when the page first mounted.
  useEffect(() => {
    if (open) setLocalDt(toLocalInputValue(new Date()));
  }, [open]);

  // `<input type="datetime-local">` submits `YYYY-MM-DDTHH:MM` (no offset),
  // but the server action's zod schema requires a full ISO 8601 datetime.
  // Derive a hidden `occurredAt` that the browser treats as local time then
  // serialises with UTC offset via Date → toISOString.
  const occurredAtIso = useMemo(() => {
    if (!localDt) return "";
    const d = new Date(localDt);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [localDt]);

  const close = useCallback(() => setOpen(false), []);

  // Escape to close + body-scroll lock while open.
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
    // Focus the title input on open so the form is immediately typeable.
    const t = setTimeout(() => titleInputRef.current?.focus(), 10);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, close]);

  // Close + flash toast on successful submit. useFormState transitions `state`
  // from its initial `{ ok: false }` to `{ ok: true }` when the action resolves.
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
        className="border border-gray-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-paper/60 transition-colors hover:border-brand hover:text-brand focus:border-lime focus:text-lime focus:outline-none"
      >
        + Pin event
      </button>

      {flash ? (
        <div
          role="status"
          className="pointer-events-none fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 border border-lime bg-gray-2 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-lime shadow-[0_0_40px_rgba(163,230,53,0.25)]"
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
            className="absolute inset-0 bg-ink/85 backdrop-blur-md"
            aria-hidden
          />
          <div className="relative w-full max-w-lg border border-lime bg-gray-2 shadow-[0_0_60px_rgba(163,230,53,0.18)]">
            <div className="classification-stripe absolute -top-1 left-0 right-0 h-1" />
            <div className="border-b border-gray-3 p-5">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                ● PIN EVENT · {symbol}
              </div>
              <h3
                id="add-pin-title"
                className="mt-2 font-display text-2xl leading-tight text-paper"
              >
                Mark a moment on the chart
              </h3>
              <p className="mt-2 text-sm text-paper/60">
                Only you will see this pin. It renders as a grey marker below
                the price candles.
              </p>
            </div>

            <form action={formAction} className="space-y-4 p-5">
              <input type="hidden" name="symbol" value={symbol} />

              <div>
                <label
                  htmlFor="pin-title"
                  className="block font-mono text-[10px] uppercase tracking-widest2 text-paper/40"
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
                  className="mt-2 w-full border border-gray-3 bg-ink px-3 py-2 font-mono text-sm text-paper outline-none transition-colors focus:border-lime"
                />
              </div>

              <div>
                <label
                  htmlFor="pin-body"
                  className="block font-mono text-[10px] uppercase tracking-widest2 text-paper/40"
                >
                  Notes <span className="text-paper/30">(optional)</span>
                </label>
                <textarea
                  id="pin-body"
                  name="body"
                  rows={4}
                  maxLength={2000}
                  className="mt-2 w-full resize-none border border-gray-3 bg-ink px-3 py-2 font-mono text-sm text-paper outline-none transition-colors focus:border-lime"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                    Symbol
                  </label>
                  <div className="mt-2 border border-gray-3 bg-ink/60 px-3 py-2 font-mono text-sm text-paper/70">
                    {symbol}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="pin-occurred-at"
                    className="block font-mono text-[10px] uppercase tracking-widest2 text-paper/40"
                  >
                    Occurred at *
                  </label>
                  <input
                    id="pin-occurred-at"
                    type="datetime-local"
                    required
                    value={localDt}
                    onChange={(e) => setLocalDt(e.currentTarget.value)}
                    className="mt-2 w-full border border-gray-3 bg-ink px-3 py-2 font-mono text-sm text-paper outline-none transition-colors focus:border-lime"
                  />
                  <input type="hidden" name="occurredAt" value={occurredAtIso} />
                </div>
              </div>

              {state.error ? (
                <div
                  role="alert"
                  className="border border-blood/60 bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-[#fda4af]"
                >
                  {ERROR_MESSAGES[state.error] ?? state.error}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className={cn(
                    "border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/60",
                    "hover:border-brand hover:text-brand focus:border-lime focus:text-lime focus:outline-none",
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

export default AddPinButton;
