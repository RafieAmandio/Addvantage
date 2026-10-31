"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { useFormState, useFormStatus } from "react-dom";
import { signupAction, type SignupActionState } from "@/features/auth/actions";
import { AuthShell, authEyebrow, authInput, authLabel, authPrimary } from "./AuthShell";

const INITIAL_STATE: SignupActionState = { ok: false };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Please check your inputs.",
  password_too_short: "Password must be at least 8 characters.",
  email_taken: "This email is already registered.",
  signup_failed: "Something went wrong. Please try again.",
};

const STEPS = [
  { n: "1", label: "Account" },
  { n: "2", label: "Experience" },
  { n: "3", label: "Password" },
  { n: "4", label: "Liability waiver" },
  { n: "5", label: "Profile" },
];

const STEP_TITLES = [
  "Create your account",
  "How long have you been trading?",
  "Set your password",
];

const EXPERIENCE_OPTIONS = [
  "<1 Year",
  "1-3 Years",
  "3-7 Years",
  "7+ Years",
  "Professional",
  "Other",
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={cn(authPrimary, "disabled:cursor-wait")}>
      {pending ? "Creating account" : "Create account"}
    </button>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-down", "bg-brand", "bg-brand", "bg-up"];

  if (password.length === 0) return null;

  return (
    <div className="mt-3 flex items-center gap-3">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn("h-1 flex-1 rounded-full", i < score ? colors[score - 1] : "bg-white/[0.08]")}
          />
        ))}
      </div>
      <p className="w-16 text-right text-[12px] text-white/40">{labels[score - 1] ?? "Too short"}</p>
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

  useEffect(() => {
    if (state.done) {
      router.push(`/signup/verify?email=${encodeURIComponent(form.email)}`);
    }
  }, [state.done, form.email, router]);

  const canContinueStep0 = form.email.trim().length > 0;
  const canContinueStep1 = form.experience.length > 0;

  return (
    <AuthShell
      width="lg"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-white hover:text-brand">
            Sign in
          </Link>
        </>
      }
    >
      <ol className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            className={cn(i === step ? "font-medium text-white" : i < step ? "text-white/55" : "text-white/30")}
          >
            <span className={cn("font-num", i === step && "text-brand")}>{s.n}</span> {s.label}
          </li>
        ))}
      </ol>

      <div className="mt-6">
        <p className={authEyebrow}>
          Step {step + 1} of 3 · {STEPS[step]?.label}
        </p>
        <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">{STEP_TITLES[step]}</h1>
      </div>

      {step === 0 && (
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="signup-email" className={authLabel}>
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              className={authInput}
            />
          </div>
          <div>
            <label htmlFor="signup-handle" className={authLabel}>
              Display name (optional)
            </label>
            <input
              id="signup-handle"
              type="text"
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value })}
              autoComplete="username"
              className={authInput}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="mt-2">
          <p className="text-[14px] leading-[21px] text-white/55">This platform is built for experienced traders.</p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setForm({ ...form, experience: opt })}
                aria-pressed={form.experience === opt}
                className={cn(
                  "h-11 rounded-xl px-4 text-[14px] ring-1 transition-colors focus-visible:outline-none focus-visible:ring-brand",
                  form.experience === opt
                    ? "bg-brand font-semibold text-black ring-brand"
                    : "bg-raised text-white/70 ring-white/[0.08] hover:text-white"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="signup-password" className={authLabel}>
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className={authInput}
            />
            <PasswordStrength password={form.password} />
          </div>
          <div className="rounded-xl bg-raised p-4 text-[14px] leading-[21px] text-white/55">
            <p className="font-medium text-white">You are about to attest:</p>
            <ul className="mt-2 space-y-1">
              <li>You are not a beginner.</li>
              <li>You are not gambling.</li>
              <li>You understand position sizing and risk.</li>
              <li>You will sign a liability waiver after verification.</li>
            </ul>
          </div>
          {state.error && (
            <div role="alert" className="text-[13px] text-down">
              {ERROR_MESSAGES[state.error] ?? "Something went wrong. Please try again."}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
          className="h-11 rounded-full px-4 text-[14px] text-white/55 transition-colors hover:bg-raised hover:text-white disabled:invisible"
        >
          Back
        </button>
        {step < 2 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={step === 0 ? !canContinueStep0 : !canContinueStep1}
            className={authPrimary}
          >
            Continue
          </button>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="email" value={form.email} />
            <input type="hidden" name="password" value={form.password} />
            <input type="hidden" name="handle" value={form.handle} />
            <SubmitButton />
          </form>
        )}
      </div>
    </AuthShell>
  );
}
