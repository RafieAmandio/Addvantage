"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/Button";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import {
  requestSignupOtp,
  type SignupActionState,
} from "@/features/auth/actions";
import { useAppState } from "@/lib/state";

const INITIAL_STATE: SignupActionState = { ok: false };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "That email doesn't look right.",
  rate_limited: "Too many attempts. Try again in a minute.",
  send_failed: "Something went wrong. Try again.",
};

export function SignupWizard() {
  const { setOperatorName } = useAppState();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: "",
    handle: "",
    experience: "",
  });
  const [state, formAction] = useFormState(requestSignupOtp, INITIAL_STATE);

  const canProceed = form.email.trim().length > 0 && form.experience.length > 0;

  const persistHandle = () => {
    const trimmed = form.handle.trim();
    if (trimmed.length > 0) setOperatorName(trimmed);
  };

  return (
    <main className="stagger relative mx-auto grid max-w-7xl grid-cols-12 gap-4 px-4 py-12 sm:gap-6 sm:px-6 sm:py-20">
      <div className="col-span-12 lg:col-span-5">
        <SectionNumber n="00 /" label="ENROLLMENT" />
        <h1 className="mt-8 font-display text-6xl leading-[0.9] text-white">
          This is a
          <br />
          <span className="italic text-brand">filter,</span>
          <br />
          not a funnel.
        </h1>
        <p className="mt-8 max-w-sm font-display text-lg text-white/60">
          Three questions, then a liability waiver. If you can't get through
          the waiver, you're not who we built this for.
        </p>

        <div className="mt-12 space-y-3 font-mono text-[10px] uppercase tracking-widest2">
          {[
            { n: "01", label: "Identifier", done: step > 0 },
            { n: "02", label: "Self-classification", done: step > 1 },
            { n: "03", label: "Confirmation", done: step > 2 || state.sent },
            { n: "04", label: "Liability waiver", done: false },
            { n: "05", label: "Trader profile", done: false },
          ].map((s, i) => (
            <div
              key={s.n}
              className={cn(
                "flex items-center gap-3",
                i === step && !state.sent
                  ? "text-brand"
                  : s.done
                  ? "text-white/70"
                  : "text-white/30"
              )}
            >
              <span>{s.n}</span>
              <span className="h-px flex-1 bg-current opacity-30" />
              <span>{s.label}</span>
              {i === step && !state.sent && <span className="led" aria-hidden />}
              {s.done && <span className="text-moss">✓</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-12 border border-gray-3 bg-black-2/40 p-10 lg:col-span-7">
        {state.sent ? (
          <div className="space-y-6">
            <DataLabel>Transmission dispatched</DataLabel>
            <div className="font-display text-2xl text-white">
              Magic link dispatched to{" "}
              <span className="italic text-brand">{state.email}</span>.
            </div>
            <p className="font-mono text-[11px] uppercase tracking-widest2 text-white/60">
              Follow the link to sign the liability waiver and complete
              enrollment. Link expires in 15 minutes.
            </p>
            <div className="mt-8 border-t border-gray-3 pt-4 text-center font-mono text-[9px] uppercase tracking-widest2 text-white/30">
              Already enrolled?{" "}
              <Link href="/login" className="text-white/60 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none">
                Operator login →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {step === 0 && (
              <div className="space-y-6 stagger">
                <DataLabel>Step 01 / Identifier</DataLabel>
                <h2 className="font-display text-3xl text-white">
                  How do we reach you?
                </h2>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    autoComplete="email"
                    placeholder="operator@domain.local"
                    className="mt-2 w-full border-b border-white/20 bg-transparent py-3 font-mono text-lg text-white placeholder:text-white/20 outline-none transition-colors focus-visible:border-brand"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                    Operator handle (optional)
                  </label>
                  <input
                    type="text"
                    value={form.handle}
                    onChange={(e) =>
                      setForm({ ...form, handle: e.target.value })
                    }
                    autoComplete="username"
                    placeholder="operator-00417"
                    className="mt-2 w-full border-b border-white/20 bg-transparent py-3 font-mono text-lg text-white placeholder:text-white/20 outline-none transition-colors focus-visible:border-brand"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6 stagger">
                <DataLabel>Step 02 / Self-classification</DataLabel>
                <h2 className="font-display text-3xl text-white">
                  How long have you been in markets?
                </h2>
                <p className="font-mono text-[11px] uppercase tracking-widest2 text-brand">
                  ANTS is not for beginners. We will hold you to this answer.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    "< 1 year",
                    "1 — 3 years",
                    "3 — 7 years",
                    "7+ years",
                    "Professional",
                    "Other",
                  ].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm({ ...form, experience: opt })}
                      className={cn(
                        "border p-4 text-left font-mono text-xs uppercase tracking-widest2 transition-all focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
                        form.experience === opt
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-gray-3 text-white/60 hover:border-brand/40 hover:text-white"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 stagger">
                <DataLabel>Step 03 / Confirmation</DataLabel>
                <h2 className="font-display text-3xl text-white">
                  Final confirmation.
                </h2>
                <div className="border border-brand/40 bg-brand/5 p-6 font-mono text-[11px] uppercase tracking-widest2 text-white/80">
                  <div className="mb-3 text-brand">YOU ARE ABOUT TO ATTEST:</div>
                  <ul className="space-y-2">
                    <li>· You are not a beginner.</li>
                    <li>· You are not gambling.</li>
                    <li>· You understand position sizing and risk.</li>
                    <li>
                      · You will sign a liability waiver in the next step.
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-white/50">
                  Press continue to proceed to the liability waiver. There is
                  no way around this step.
                </p>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => step > 0 && setStep(step - 1)}
                disabled={step === 0}
                className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand disabled:opacity-30 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                ← Back
              </button>
              {step < 2 ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => setStep(step + 1)}
                >
                  Continue →
                </Button>
              ) : (
                <form action={formAction} onSubmit={persistHandle}>
                  <input type="hidden" name="email" value={form.email} />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!canProceed}
                    className={
                      canProceed ? "" : "opacity-30 cursor-not-allowed"
                    }
                  >
                    Proceed to waiver →
                  </Button>
                </form>
              )}
            </div>
            {state.error ? (
              <div className="mt-4 text-right font-mono text-xs text-blood-bright">
                {ERROR_MESSAGES[state.error] ?? "Something went wrong."}
              </div>
            ) : null}
            <div className="mt-8 border-t border-gray-3 pt-4 text-center font-mono text-[9px] uppercase tracking-widest2 text-white/30">
              Already enrolled?{" "}
              <Link href="/login" className="text-white/60 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none">
                Operator login →
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
