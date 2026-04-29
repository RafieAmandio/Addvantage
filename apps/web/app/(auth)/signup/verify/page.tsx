"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  verifyEmailAction,
  resendVerificationAction,
} from "@/features/auth/actions";

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");

  const [status, setStatus] = useState<
    "waiting" | "verifying" | "success" | "error"
  >(token ? "verifying" : "waiting");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;
    verifyEmailAction(token).then((result) => {
      setStatus(result.ok ? "success" : "error");
    });
  }, [token]);

  const handleResend = async () => {
    const result = await resendVerificationAction();
    if (result.ok) setResent(true);
  };

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Left — dark panel */}
      <div className="relative flex flex-col overflow-hidden bg-gray px-6 pb-12 pt-20 md:px-12 md:pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/figma/login-bg.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-lighten"
        />

        <div className="relative z-10 flex items-center justify-between">
          <span className="font-mono text-base font-bold text-white">
            +vantage
          </span>
          <Link
            href="/"
            className="btn-pixel rounded-lg border border-white/20 bg-black/40 px-4 py-2 font-mono text-sm font-bold text-white backdrop-blur-sm transition-colors hover:border-brand hover:text-brand"
          >
            &larr; Return To Brief
          </Link>
        </div>

        <div className="relative z-10 mt-4 flex items-baseline gap-3 font-mono text-sm">
          <span className="font-bold text-brand">00 /</span>
          <span className="h-px flex-1 bg-brand/40" />
          <span className="font-bold text-white">Verification</span>
        </div>

        <div className="relative z-10 mt-auto">
          <h1 className="font-sans text-[clamp(2.5rem,7vw,72px)] font-bold leading-[0.95] text-white">
            Check your
            <br />
            <span className="text-brand">inbox.</span>
          </h1>
          <p className="mt-6 max-w-sm font-mono text-sm font-light leading-[1.5] text-white/60">
            We sent a verification link to confirm your identity. No
            verification, no access.
          </p>
        </div>
      </div>

      {/* Right — status panel */}
      <div className="flex flex-col items-center justify-center bg-white px-6 py-16 md:px-12">
        <div className="w-full max-w-md">
          {status === "waiting" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                <span className="text-3xl">✉</span>
              </div>
              <p className="font-mono text-sm text-black/50">
                Verification Pending
              </p>
              <h2 className="font-mono text-xl font-bold text-black">
                Confirm Your Email
              </h2>
              {email && (
                <p className="font-mono text-sm text-black/60">
                  We sent a link to{" "}
                  <span className="font-bold text-black">{email}</span>
                </p>
              )}
              <p className="font-mono text-sm leading-relaxed text-black/50">
                Click the link in the email to verify your account. Once
                verified, you can log in and proceed to the liability waiver.
              </p>

              <div className="space-y-3 pt-4">
                <Link
                  href="/login"
                  className="btn-pixel block w-full rounded-lg bg-brand py-4 text-center font-mono text-sm font-bold text-black transition-colors hover:bg-brand-dim"
                >
                  I&apos;ve Verified — Go to Login
                </Link>

                {!resent ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="w-full rounded-lg border border-gray-3 py-4 font-mono text-sm text-black/60 transition-colors hover:border-black/40"
                  >
                    Didn&apos;t receive it? Resend
                  </button>
                ) : (
                  <p className="rounded-lg border border-brand/30 bg-brand/5 py-4 text-center font-mono text-sm text-black/60">
                    Verification email resent.
                  </p>
                )}
              </div>
            </div>
          )}

          {status === "verifying" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                <span className="animate-spin text-2xl">⟳</span>
              </div>
              <h2 className="font-mono text-xl font-bold text-black">
                Verifying...
              </h2>
              <p className="font-mono text-sm text-black/50">
                Confirming your email address.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                <span className="text-3xl">✓</span>
              </div>
              <p className="font-mono text-sm text-brand">Verified</p>
              <h2 className="font-mono text-xl font-bold text-black">
                Email Confirmed
              </h2>
              <p className="font-mono text-sm leading-relaxed text-black/50">
                Your identity has been confirmed. You can now log in and proceed
                to the liability waiver.
              </p>
              <Link
                href="/login"
                className="btn-pixel block w-full rounded-lg bg-brand py-4 text-center font-mono text-sm font-bold text-black transition-colors hover:bg-brand-dim"
              >
                Proceed to Login
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blood/10">
                <span className="text-3xl">✗</span>
              </div>
              <p className="font-mono text-sm text-blood-bright">Failed</p>
              <h2 className="font-mono text-xl font-bold text-black">
                Verification Failed
              </h2>
              <p className="font-mono text-sm leading-relaxed text-black/50">
                The link may have expired or already been used. Request a new
                one.
              </p>
              <div className="space-y-3">
                <Link
                  href="/signup"
                  className="btn-pixel block w-full rounded-lg bg-brand py-4 text-center font-mono text-sm font-bold text-black transition-colors hover:bg-brand-dim"
                >
                  Try Again
                </Link>
                <Link
                  href="/login"
                  className="block w-full rounded-lg border border-gray-3 py-4 text-center font-mono text-sm text-black/60 transition-colors hover:border-black/40"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
