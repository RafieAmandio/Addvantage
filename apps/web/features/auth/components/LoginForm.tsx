"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginActionState } from "@/features/auth/actions";

const INITIAL_STATE: LoginActionState = { ok: false };
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Check your email and password.",
  invalid_credentials: "Wrong email or password. Try again.",
  email_not_verified: "Email not verified yet. Check your inbox.",
  login_failed: "Something went wrong. Please try again.",
};

function useScrambleReveal(text: string, delay = 0) {
  const [display, setDisplay] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let step = 0;
      const steps = 10;
      const interval = 40;
      setDisplay(
        text.replace(/\S/g, () => CHARS[Math.floor(Math.random() * CHARS.length)])
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
          setDone(true);
        }
      }, interval);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return { display, done };
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn-pixel group mt-10 flex w-full items-center justify-center gap-2.5 rounded-lg bg-brand py-4 font-mono text-base font-bold text-black transition-all hover:bg-brand-dim active:scale-[0.98] disabled:cursor-wait"
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
        "Sign In"
      )}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, INITIAL_STATE);
  const [mounted, setMounted] = useState(false);
  const header = useScrambleReveal("Sign in to your account", 200);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <form action={formAction} className="w-full max-w-md">
      <p
        className="text-center font-mono text-base text-black transition-all duration-500"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
        }}
      >
        {header.display || " "}
      </p>

      <div className="mt-10 space-y-8">
        <div
          className="transition-all duration-500"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transitionDelay: "300ms",
          }}
        >
          <label className="block font-mono text-sm font-bold text-black">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded-lg border border-gray-3 bg-white-2 px-4 py-3 font-mono text-base text-black shadow-none outline-none transition-all duration-300 focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_rgba(255,212,0,0.15)] focus-visible:ring-0"
          />
        </div>
        <div
          className="transition-all duration-500"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transitionDelay: "450ms",
          }}
        >
          <label className="block font-mono text-sm font-bold text-black">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="mt-2 w-full rounded-lg border border-gray-3 bg-white-2 px-4 py-3 font-mono text-base text-black shadow-none outline-none transition-all duration-300 focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_rgba(255,212,0,0.15)] focus-visible:ring-0"
          />
        </div>

        {state.error && (
          <div className="animate-[shake_0.3s_ease-out] font-mono text-sm text-blood-bright">
            ● {ERROR_MESSAGES[state.error] ?? "SYSTEM FAULT. Retry."}
          </div>
        )}
      </div>

      <div
        className="transition-all duration-500"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transitionDelay: "600ms",
        }}
      >
        <SubmitButton />
      </div>

      <div
        className="transition-all duration-500"
        style={{
          opacity: mounted ? 1 : 0,
          transitionDelay: "750ms",
        }}
      >
        <Link
          href="/signup"
          className="mt-4 flex w-full items-center justify-center rounded-lg border border-gray-3 py-4 font-mono text-sm text-black transition-all duration-200 hover:border-black active:scale-[0.98]"
        >
          Don&apos;t have an account?{" "}
          <span className="ml-1 font-bold">Sign Up &rarr;</span>
        </Link>

        <p className="mt-8 font-mono text-xs leading-[1.5] text-black/40">
          By signing in you agree to the terms accepted during registration.
        </p>
      </div>
    </form>
  );
}
