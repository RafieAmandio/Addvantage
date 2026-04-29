"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { useFormState, useFormStatus } from "react-dom";
import { signupAction, type SignupActionState } from "@/features/auth/actions";

const INITIAL_STATE: SignupActionState = { ok: false };
const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

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
  { n: "04", label: "Liability Waiver" },
  { n: "05", label: "Profile" },
];

const EXPERIENCE_OPTIONS = [
  "<1 Year",
  "1-3 Years",
  "3-7 Years",
  "7+ Years",
  "Professional",
  "Other",
];

function useScrambleReveal(text: string, trigger: boolean, delay = 0) {
  const [display, setDisplay] = useState("");
  const prevTrigger = useRef(false);

  useEffect(() => {
    if (!trigger) {
      prevTrigger.current = false;
      setDisplay("");
      return;
    }
    if (prevTrigger.current) return;
    prevTrigger.current = true;

    const timeout = setTimeout(() => {
      let step = 0;
      const steps = 10;
      setDisplay(
        text.replace(
          /\S/g,
          () => CHARS[Math.floor(Math.random() * CHARS.length)]
        )
      );
      const id = setInterval(() => {
        step++;
        const settled = Math.floor((step / steps) * text.length);
        setDisplay(
          text
            .split("")
            .map((ch, i) =>
              ch === " "
                ? " "
                : i < settled
                  ? text[i]
                  : CHARS[Math.floor(Math.random() * CHARS.length)]
            )
            .join("")
        );
        if (step >= steps) {
          clearInterval(id);
          setDisplay(text);
        }
      }, 40);
    }, delay);
    return () => clearTimeout(timeout);
  }, [trigger, text, delay]);

  return display;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  const [scramble, setScramble] = useState("Create Account");
  const interval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (pending) {
      const words = [
        "Creating account...",
        "Setting up...",
        "Almost there...",
      ];
      let i = 0;
      interval.current = setInterval(() => {
        i = (i + 1) % words.length;
        setScramble(words[i]!);
      }, 400);
    } else {
      clearInterval(interval.current);
      setScramble("Create Account");
    }
    return () => clearInterval(interval.current);
  }, [pending]);

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-pixel rounded-lg bg-brand px-6 py-3 font-mono text-sm font-bold text-black transition-all hover:bg-brand-dim active:scale-[0.97] disabled:animate-pulse"
    >
      {scramble}
    </button>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const labels = ["WEAK", "FAIR", "GOOD", "STRONG"];
  const colors = [
    "bg-blood-bright",
    "bg-brand-deep",
    "bg-brand",
    "bg-moss",
  ];

  if (password.length === 0) return null;

  return (
    <div className="mt-3 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i < score ? colors[score - 1] : "bg-gray-3"
            )}
            style={{
              transform: i < score ? "scaleX(1)" : "scaleX(0.6)",
              transformOrigin: "left",
            }}
          />
        ))}
      </div>
      <p className="font-mono text-[10px] text-black/40">
        {labels[score - 1] ?? "TOO SHORT"}
      </p>
    </div>
  );
}

export function SignupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [stepKey, setStepKey] = useState(0);
  const [form, setForm] = useState({
    email: "",
    password: "",
    handle: "",
    experience: "",
  });
  const [state, formAction] = useFormState(signupAction, INITIAL_STATE);
  const [mounted, setMounted] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (state.done) {
      router.push(`/signup/verify?email=${encodeURIComponent(form.email)}`);
    }
  }, [state.done, form.email, router]);

  // Slow background drift
  useEffect(() => {
    let frame: number;
    let t = 0;
    function drift() {
      t += 0.001;
      if (imgRef.current) {
        const x = Math.sin(t) * 8;
        const y = Math.cos(t * 0.7) * 5;
        imgRef.current.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
      }
      frame = requestAnimationFrame(drift);
    }
    frame = requestAnimationFrame(drift);
    return () => cancelAnimationFrame(frame);
  }, []);

  const advanceStep = (next: number) => {
    setStep(next);
    setStepKey((k) => k + 1);
  };

  const stepTitle = useScrambleReveal(
    step === 0
      ? "Create your account"
      : step === 1
        ? "How long have you been trading?"
        : "Set your password",
    true,
    100
  );

  const canContinueStep0 = form.email.trim().length > 0;
  const canContinueStep1 = form.experience.length > 0;
  const canSubmit =
    form.email.trim().length > 0 &&
    form.password.length >= 8 &&
    form.experience.length > 0;

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Left — dark panel */}
      <div className="relative flex flex-col overflow-hidden bg-gray px-6 pb-12 pt-20 md:px-12 md:pb-16">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src="/figma/login-bg.png"
            alt=""
            className="h-full w-full object-cover opacity-20 mix-blend-lighten will-change-transform"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
        </div>

        {/* Nav */}
        <div
          className="relative z-10 flex items-center justify-between transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-12px)",
          }}
        >
          <Link href="/" className="flex items-center gap-[7.78px]">
            <span className="font-mono text-base font-bold text-white">
              +vantage
            </span>
          </Link>
          <Link
            href="/"
            className="btn-pixel rounded-lg border border-white/20 bg-black/40 px-4 py-2 font-mono text-sm font-bold text-white backdrop-blur-sm transition-colors hover:border-brand hover:text-brand"
          >
            &larr; Return To Brief
          </Link>
        </div>

        {/* Section marker */}
        <div
          className="relative z-10 mt-4 flex items-baseline gap-3 font-mono text-sm transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transitionDelay: "200ms",
          }}
        >
          <span className="font-bold text-brand">00 /</span>
          <span
            className="h-px flex-1 bg-brand/40 transition-all duration-1000 ease-out"
            style={{
              transform: mounted ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
              transitionDelay: "400ms",
            }}
          />
          <span className="font-bold text-white">Sign Up</span>
        </div>

        {/* Heading */}
        <div className="relative z-10 mt-auto">
          <h1 className="font-sans text-[clamp(2.5rem,7vw,72px)] font-bold leading-[0.95] text-white">
            <span
              className="block transition-all duration-700"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "300ms",
              }}
            >
              This is a
            </span>
            <span
              className="block text-brand transition-all duration-700"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "450ms",
              }}
            >
              filter,
            </span>
            <span
              className="block transition-all duration-700"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "600ms",
              }}
            >
              not a funnel.
            </span>
          </h1>
          <p
            className="mt-6 max-w-sm font-mono text-sm font-light leading-[1.5] text-white/60 transition-all duration-700"
            style={{
              opacity: mounted ? 1 : 0,
              transitionDelay: "800ms",
            }}
          >
            Three steps, then a liability waiver. If you can&apos;t get
            through it, this isn&apos;t for you.
          </p>
        </div>

        {/* Step progress */}
        <div className="relative z-10 mt-12 space-y-2">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={cn(
                "flex items-center gap-3 font-mono text-xs transition-all duration-300",
                i === step
                  ? "text-brand"
                  : i < step
                    ? "text-white/50"
                    : "text-white/20"
              )}
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateX(0)" : "translateX(-16px)",
                transitionDelay: `${900 + i * 80}ms`,
              }}
            >
              <span className="font-bold">{s.n}</span>
              <span
                className="h-px flex-1 bg-current transition-all duration-500"
                style={{
                  opacity: i <= step ? 0.6 : 0.15,
                  transform: i <= step ? "scaleX(1)" : "scaleX(0.4)",
                  transformOrigin: "left",
                }}
              />
              <span>{s.label}</span>
              {i === step && (
                <span className="led animate-pulse" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-col items-center justify-center bg-white px-6 py-16 md:px-12">
        <div key={stepKey} className="w-full max-w-md">
          {/* Step 01 — Identifier */}
          {step === 0 && (
            <div className="space-y-6">
              <p
                className="font-mono text-sm text-black/50"
                style={{ animation: "fadeSlideUp 0.4s ease-out both" }}
              >
                Step 01 / Account
              </p>
              <h2
                className="font-mono text-xl font-bold text-black"
                style={{ animation: "fadeSlideUp 0.4s ease-out 0.1s both" }}
              >
                {stepTitle}
              </h2>
              <div style={{ animation: "fadeSlideUp 0.4s ease-out 0.2s both" }}>
                <label className="block font-mono text-sm font-bold text-black">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                  className="mt-2 w-full rounded-lg border border-gray-3 bg-white-2 px-4 py-3 font-mono text-base text-black shadow-none outline-none transition-all duration-300 focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_rgba(255,212,0,0.15)]"
                />
              </div>
              <div style={{ animation: "fadeSlideUp 0.4s ease-out 0.3s both" }}>
                <label className="block font-mono text-sm font-bold text-black">
                  Display Name (optional)
                </label>
                <input
                  type="text"
                  value={form.handle}
                  onChange={(e) => setForm({ ...form, handle: e.target.value })}
                  autoComplete="username"
                  className="mt-2 w-full rounded-lg border border-gray-3 bg-white-2 px-4 py-3 font-mono text-base text-black shadow-none outline-none transition-all duration-300 focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_rgba(255,212,0,0.15)]"
                />
              </div>
            </div>
          )}

          {/* Step 02 — Self-Classification */}
          {step === 1 && (
            <div className="space-y-6">
              <p
                className="font-mono text-sm text-black/50"
                style={{ animation: "fadeSlideUp 0.4s ease-out both" }}
              >
                Step 02 / Experience
              </p>
              <h2
                className="font-mono text-xl font-bold text-black"
                style={{ animation: "fadeSlideUp 0.4s ease-out 0.1s both" }}
              >
                {stepTitle}
              </h2>
              <p
                className="font-mono text-sm text-black/50"
                style={{ animation: "fadeSlideUp 0.4s ease-out 0.15s both" }}
              >
                This platform is built for experienced traders.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {EXPERIENCE_OPTIONS.map((opt, i) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm({ ...form, experience: opt })}
                    className={cn(
                      "rounded-lg border px-4 py-3 font-mono text-sm transition-all duration-200 active:scale-[0.96]",
                      form.experience === opt
                        ? "border-brand bg-brand font-bold text-black shadow-[0_0_0_3px_rgba(255,212,0,0.2)]"
                        : "border-gray-3 text-black/60 hover:border-black/40 hover:bg-black/[0.02]"
                    )}
                    style={{
                      animation: `fadeSlideUp 0.3s ease-out ${0.2 + i * 0.06}s both`,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 03 — Confirmation (password + submit) */}
          {step === 2 && (
            <div className="space-y-6">
              <p
                className="font-mono text-sm text-black/50"
                style={{ animation: "fadeSlideUp 0.4s ease-out both" }}
              >
                Step 03 / Password
              </p>
              <h2
                className="font-mono text-xl font-bold text-black"
                style={{ animation: "fadeSlideUp 0.4s ease-out 0.1s both" }}
              >
                {stepTitle}
              </h2>
              <div style={{ animation: "fadeSlideUp 0.4s ease-out 0.2s both" }}>
                <label className="block font-mono text-sm font-bold text-black">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  autoComplete="new-password"
                  placeholder="min 8 characters"
                  className="mt-2 w-full rounded-lg border border-gray-3 bg-white-2 px-4 py-3 font-mono text-base text-black placeholder:text-black/30 shadow-none outline-none transition-all duration-300 focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_rgba(255,212,0,0.15)]"
                />
                <PasswordStrength password={form.password} />
              </div>
              <div
                className="rounded-lg border border-gray-3 bg-white-2 p-6 font-mono text-sm leading-relaxed text-black/60"
                style={{ animation: "fadeSlideUp 0.4s ease-out 0.3s both" }}
              >
                <p className="mb-3 font-bold text-black">
                  You are about to attest:
                </p>
                <ul className="space-y-1">
                  <li>· You are not a beginner.</li>
                  <li>· You are not gambling.</li>
                  <li>· You understand position sizing and risk.</li>
                  <li>
                    · You will sign a liability waiver after verification.
                  </li>
                </ul>
              </div>
              {state.error && (
                <div className="animate-[shake_0.3s_ease-out] font-mono text-sm text-blood-bright">
                  ● {ERROR_MESSAGES[state.error] ?? "SYSTEM FAULT. Retry."}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div
            className="mt-10 flex items-center justify-between"
            style={{ animation: "fadeSlideUp 0.4s ease-out 0.4s both" }}
          >
            <button
              type="button"
              onClick={() => step > 0 && advanceStep(step - 1)}
              disabled={step === 0}
              className="font-mono text-sm text-black/40 transition-all duration-200 hover:text-black disabled:opacity-0"
            >
              &larr; Back
            </button>
            {step < 2 ? (
              <button
                type="button"
                onClick={() => advanceStep(step + 1)}
                disabled={step === 0 ? !canContinueStep0 : !canContinueStep1}
                className="btn-pixel rounded-lg bg-brand px-6 py-3 font-mono text-sm font-bold text-black transition-all hover:bg-brand-dim active:scale-[0.97] disabled:opacity-40"
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

          {/* Login link */}
          <div
            className="mt-8 text-center font-mono text-sm text-black/50"
            style={{ animation: "fadeSlideUp 0.4s ease-out 0.5s both" }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-black transition-colors hover:text-brand"
            >
              Sign In &rarr;
            </Link>
          </div>

          {/* Step dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === step
                    ? "w-6 bg-black"
                    : i < step
                      ? "w-2 bg-brand"
                      : "w-2 bg-black/20"
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-center font-mono text-xs text-black/40">
            ({step + 1}/3) {STEPS[step]?.label}
          </p>
        </div>
      </div>
    </main>
  );
}
