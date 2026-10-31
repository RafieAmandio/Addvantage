"use client";

import { useFormState, useFormStatus } from "react-dom";
import { authInput, authLabel, authPrimary } from "@/features/auth/components/AuthShell";
import { submitGiveawayEntry, type GiveawayState } from "@/features/giveaway/actions";

const INITIAL: GiveawayState = { ok: false };

const inputClass = authInput;
const labelClass = authLabel;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${authPrimary} mt-6 w-full disabled:cursor-wait`}
    >
      {pending ? "Submitting…" : "Join the giveaway"}
    </button>
  );
}

export function GiveawayForm() {
  const [state, formAction] = useFormState(submitGiveawayEntry, INITIAL);

  if (state.ok) {
    return (
      <div role="status">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-up">Entry recorded</p>
        <p className="mt-2 text-[18px] font-semibold text-white">You&apos;re in.</p>
        <p className="mt-1 text-[14px] leading-[21px] text-white/55">
          We&apos;ll reach you on the contact you provided when the <span className="text-white">$100 giveaway</span> is drawn.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="w-full">
      {/* Honeypot: hidden from users, bots fill it → rejected. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="space-y-4">
        <div>
          <label htmlFor="bingxUid" className={labelClass}>
            BingX User ID (UID)
          </label>
          <input
            id="bingxUid"
            name="bingxUid"
            inputMode="numeric"
            required
            placeholder="e.g. 12345678"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact" className={labelClass}>
            Email or Telegram
          </label>
          <input
            id="contact"
            name="contact"
            required
            placeholder="you@email.com or @handle"
            className={inputClass}
          />
        </div>
      </div>

      {state.error && <p role="alert" className="mt-4 text-[13px] text-down">{state.error}</p>}

      <SubmitButton />

      <p className="mt-3 text-center text-[12px] leading-[18px] text-white/40">
        Submit your UID only after you&apos;ve registered and traded on BingX.
      </p>
    </form>
  );
}
