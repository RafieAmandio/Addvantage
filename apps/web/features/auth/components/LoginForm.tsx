"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginActionState } from "@/features/auth/actions";
import { authInput, authLabel, authPrimary, authSecondary } from "./AuthShell";

const INITIAL_STATE: LoginActionState = { ok: false };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Check your email and password.",
  invalid_credentials: "Wrong email or password. Try again.",
  email_not_verified: "Email not verified yet. Check your inbox.",
  login_failed: "Something went wrong. Please try again.",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${authPrimary} mt-6 w-full disabled:cursor-wait disabled:opacity-60`}
    >
      {pending ? (
        <>
          <span
            aria-hidden
            className="inline-block h-4 w-4 shrink-0 border-2 border-black/25 border-t-black"
            style={{ animation: "btnSpin 0.7s steps(8) infinite" }}
          />
          Signing in
        </>
      ) : (
        "Sign in"
      )}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, INITIAL_STATE);

  return (
    <form action={formAction} className="w-full">
      <h1 className="text-[22px] font-semibold leading-7 text-white">Sign in</h1>
      <p className="mt-1 text-[14px] leading-[21px] text-white/55">Welcome back to TradeVantage.</p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className={authLabel}>
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            autoComplete="email"
            className={authInput}
          />
        </div>
        <div>
          <label htmlFor="password" className={authLabel}>
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className={authInput}
          />
        </div>

        {state.error && (
          <div role="alert" className="text-[13px] text-down">
            {ERROR_MESSAGES[state.error] ?? "Something went wrong. Please try again."}
          </div>
        )}
      </div>

      <SubmitButton />

      <Link href="/signup" className={`${authSecondary} mt-3 w-full`}>
        Create an account
      </Link>

      <p className="mt-6 text-[12px] leading-[18px] text-white/40">
        By signing in you agree to the terms accepted during registration.
      </p>
    </form>
  );
}
