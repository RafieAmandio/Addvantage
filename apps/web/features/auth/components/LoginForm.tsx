"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { cn } from "@/lib/cn";
import { loginAction, type LoginActionState } from "@/features/auth/actions";
import { PaperField, PaperInput, PaperSubmit } from "@/features/auth/components/PaperAuth";

const INITIAL_STATE: LoginActionState = { ok: false };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Check your email and password.",
  invalid_credentials: "Wrong email or password. Try again.",
  email_not_verified: "Email not verified yet. Check your inbox.",
  login_failed: "Something went wrong. Please try again.",
};

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, INITIAL_STATE);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shake, setShake] = useState(0);

  // Every failed attempt returns a fresh state object: shake once per attempt.
  useEffect(() => {
    if (state.error) setShake((n) => n + 1);
  }, [state]);

  const error = state.error ? (ERROR_MESSAGES[state.error] ?? "Something went wrong. Please try again.") : null;

  return (
    <form action={formAction} className="w-full">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.03em]">Welcome back</h2>

      <div key={shake} className={cn("mt-8 space-y-6", shake > 0 && "lv-shake")}>
        <PaperField id="login-email" label="Email">
          <PaperInput
            id="login-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            valid={EMAIL_RE.test(email.trim())}
            aria-invalid={!!error || undefined}
          />
        </PaperField>
        <PaperField id="login-password" label="Password">
          <PaperInput
            id="login-password"
            type="password"
            name="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? "login-error" : undefined}
          />
        </PaperField>
      </div>

      {error && (
        <p id="login-error" role="alert" className="mt-4 text-[14px] leading-[1.45] text-tv-downpaper">
          {error}
        </p>
      )}

      <PaperSubmit label="Log in" busyLabel="Logging in" className="mt-8 w-full" />

      <p className="mt-8 border-t border-tv-stone pt-6 text-[15px] text-tv-graphite">
        New here?{" "}
        <Link href="/signup" className="tv-link font-medium text-tv-ink">
          Request access
        </Link>
      </p>
    </form>
  );
}
