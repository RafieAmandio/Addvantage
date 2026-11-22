"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { useFormState } from "react-dom";
import { signupAction, type SignupActionState } from "@/features/auth/actions";
import { PaperAuthShell, PaperButton, PaperField, PaperInput, PaperSubmit, paperLabel } from "@/features/auth/components/PaperAuth";

const INITIAL_STATE: SignupActionState = { ok: false };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Please check your inputs.",
  password_too_short: "Password must be at least 8 characters.",
  email_taken: "This email is already registered.",
  signup_failed: "Something went wrong. Please try again.",
};

const STEPS = [
  { n: "01", label: "Account" },
  { n: "02", label: "Experience" },
  { n: "03", label: "Password" },
  { n: "04", label: "Liability waiver" },
  { n: "05", label: "Profile" },
];

const TITLES = ["Create your account", "How long have you been trading?", "Set your password"];

const EXPERIENCE_OPTIONS = ["<1 Year", "1-3 Years", "3-7 Years", "7+ Years", "Professional", "Other"];

/** Four ink segments and a mono word: how strong the password is. */
function PasswordStrength({ password }: { password: string }) {
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const labels = ["Weak", "Fair", "Good", "Strong"];

  if (password.length === 0) return null;

  return (
    <div className="mt-3 flex items-center gap-3">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("h-[3px] flex-1 rounded-[1px] transition-colors", i < score ? "bg-tv-ink" : "bg-tv-stone")} />
        ))}
      </div>
      <span className="w-[72px] text-right font-mono text-[11px] uppercase tracking-[0.08em] text-tv-mute">{password.length < 8 ? "Too short" : labels[score - 1]}</span>
    </div>
  );
}

export function SignupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: "",
    password: "",
    handle: "",
    experience: "",
  });
  const [state, formAction] = useFormState(signupAction, INITIAL_STATE);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (state.done) {
      router.push(`/signup/verify?email=${encodeURIComponent(form.email)}`);
    }
  }, [state.done, form.email, router]);

  useEffect(() => {
    if (state.error) setShake((n) => n + 1);
  }, [state]);

  const advanceStep = (next: number) => {
    setStep(next);
  };

  const canContinueStep0 = form.email.trim().length > 0;
  const canContinueStep1 = form.experience.length > 0;
  const error = state.error ? (ERROR_MESSAGES[state.error] ?? "Something went wrong. Please try again.") : null;

  return (
    <PaperAuthShell
      eyebrow="Sign up"
      title={
        <>
          This is a filter,
          <br />
          not a funnel.
        </>
      }
      copy="Three steps, then a liability waiver. If you can't get through it, this isn't for you."
      aside={
        <ol className="mb-10 hidden border-t border-tv-stone md:block" aria-label="Sign-up steps">
          {STEPS.map((s, i) => {
            const st = i < step ? "done" : i === step ? "now" : "next";
            return (
              <li
                key={s.n}
                aria-current={st === "now" ? "step" : undefined}
                className={cn("flex items-center gap-4 border-b border-tv-stone py-2 text-[15px] transition-colors", st === "next" && "text-tv-mute", st === "now" && "font-semibold")}
              >
                <span className="font-mono text-[12px] tabular-nums text-tv-mute">{s.n}</span>
                <span className="flex-1">{s.label}</span>
                <span aria-hidden className={cn("h-2.5 w-2.5 rounded-[3px] transition-colors", st === "next" ? "border border-tv-mute" : "bg-tv-ink")} />
              </li>
            );
          })}
        </ol>
      }
    >
      {/* Progress, as an ink hairline over the top rule (the plate carries the Signal). */}
      <div
        aria-hidden
        className="absolute inset-x-0 -top-px h-[2px] origin-left bg-tv-ink motion-safe:transition-transform motion-safe:duration-[640ms]"
        style={{ transform: `scaleX(${(step + 1) / 3})` }}
      />
      <div className="flex items-baseline justify-between gap-4">
        <p className="tv-eyebrow text-tv-mute">Step 0{step + 1} / 03</p>
        <p className="tv-eyebrow text-tv-mute">{STEPS[step]?.label}</p>
      </div>

      <div key={step} className="lv-in mt-3 space-y-7">
        <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]">{TITLES[step]}</h2>

        {step === 0 && (
          <>
            <PaperField id="su-email" label="Email">
              <PaperInput
                id="su-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@domain.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                valid={EMAIL_RE.test(form.email.trim())}
              />
            </PaperField>
            <PaperField id="su-handle" label="Display name (optional)">
              <PaperInput
                id="su-handle"
                type="text"
                autoComplete="username"
                value={form.handle}
                onChange={(e) => setForm({ ...form, handle: e.target.value })}
                valid={form.handle.trim().length >= 2}
              />
            </PaperField>
          </>
        )}

        {step === 1 && (
          <fieldset>
            <legend className={paperLabel}>Years trading</legend>
            <p className="mt-1.5 text-[13px] leading-[1.45] text-tv-mute">This platform is built for experienced traders.</p>
            <div role="radiogroup" className="mt-3 grid grid-cols-2 gap-2">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const on = form.experience === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setForm({ ...form, experience: opt })}
                    className={cn("flex h-11 items-center gap-2.5 rounded-[8px] border px-3.5 text-left text-[15px] transition-colors", on ? "border-tv-ink bg-tv-white" : "border-tv-stone hover:border-tv-graphite")}
                  >
                    <span aria-hidden className={cn("h-2.5 w-2.5 shrink-0 rounded-[3px]", on ? "bg-tv-ink" : "border border-tv-mute")} />
                    {opt}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <>
            <div key={shake} className={cn(shake > 0 && "lv-shake")}>
              <PaperField id="su-password" label="Password">
                <PaperInput
                  id="su-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  valid={form.password.length >= 8}
                  aria-invalid={state.error === "password_too_short" || undefined}
                />
              </PaperField>
              <PasswordStrength password={form.password} />
            </div>
            <div className="border-t border-tv-stone pt-5">
              <p className="text-[15px] font-medium">You are about to attest:</p>
              <ul className="mt-3 space-y-1.5 text-[15px] leading-[1.45] text-tv-graphite">
                {["You are not a beginner.", "You are not gambling.", "You understand position sizing and risk.", "You will sign a liability waiver after verification."].map((l) => (
                  <li key={l} className="flex gap-2.5">
                    <span aria-hidden className="mt-[7px] h-2 w-2 shrink-0 rounded-[2px] bg-tv-ink" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            {error && (
              <p role="alert" className="text-[14px] leading-[1.45] text-tv-downpaper">
                {error}
                {state.error === "email_taken" && (
                  <>
                    {" "}
                    <Link href="/login" className="tv-link font-medium text-tv-ink">
                      Sign in instead
                    </Link>
                  </>
                )}
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-tv-stone pt-6">
        <button type="button" onClick={() => step > 0 && advanceStep(step - 1)} className={cn("tv-link py-2 text-[15px] text-tv-graphite", step === 0 && "invisible")}>
          <span aria-hidden>←</span> Back
        </button>
        {step < 2 ? (
          <PaperButton type="button" busy={false} label="Continue" busyLabel="" onClick={() => advanceStep(step + 1)} disabled={step === 0 ? !canContinueStep0 : !canContinueStep1} />
        ) : (
          <form action={formAction}>
            <input type="hidden" name="email" value={form.email} />
            <input type="hidden" name="password" value={form.password} />
            <input type="hidden" name="handle" value={form.handle} />
            <PaperSubmit label="Create account" busyLabel="Creating account" />
          </form>
        )}
      </div>

      <p className="mt-8 text-[15px] text-tv-graphite">
        Already have an account?{" "}
        <Link href="/login" className="tv-link font-medium text-tv-ink">
          Sign in
        </Link>
      </p>
    </PaperAuthShell>
  );
}
