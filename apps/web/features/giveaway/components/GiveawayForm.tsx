"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitGiveawayEntry, type GiveawayState } from "@/features/giveaway/actions";

const INITIAL: GiveawayState = { ok: false };

const inputClass =
  "mt-2 w-full rounded-lg border border-gray-3 bg-gray-2 px-4 py-3 font-mono text-base text-white outline-none transition-all placeholder:text-white/25 focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_rgba(255,212,0,0.15)]";
const labelClass = "block font-mono text-sm font-bold text-white";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn-pixel mt-6 flex w-full items-center justify-center gap-2.5 rounded-lg bg-brand py-4 font-mono text-base font-bold text-black transition-all hover:bg-brand-dim active:scale-[0.98] disabled:cursor-wait"
    >
      {pending ? "Submitting…" : "Join the giveaway"}
    </button>
  );
}

export function GiveawayForm() {
  const [state, formAction] = useFormState(submitGiveawayEntry, INITIAL);

  if (state.ok) {
    return (
      <div className="rounded-xl border border-moss/30 bg-moss/[0.06] p-6 text-center">
        <p className="font-display text-2xl text-white">You&apos;re in! 🎉</p>
        <p className="mt-2 font-mono text-sm text-white/60">
          Your entry is recorded. Winners are drawn every <span className="text-brand">Saturday</span> —
          we&apos;ll reach you on the contact you provided.
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

      <div className="space-y-5">
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
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input id="email" name="email" type="email" required placeholder="you@email.com" className={inputClass} />
        </div>
        <div>
          <label htmlFor="telegram" className={labelClass}>
            Telegram or WhatsApp
          </label>
          <input
            id="telegram"
            name="telegram"
            required
            placeholder="@handle or +62…"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="name" className={labelClass}>
            Name <span className="font-normal text-white/40">(optional)</span>
          </label>
          <input id="name" name="name" placeholder="Your name" className={inputClass} />
        </div>
      </div>

      {state.error && <p className="mt-4 font-mono text-sm text-red-400">{state.error}</p>}

      <SubmitButton />

      <p className="mt-3 text-center font-mono text-[11px] text-white/30">
        Submit your UID only after you&apos;ve registered and traded on BingX.
      </p>
    </form>
  );
}
