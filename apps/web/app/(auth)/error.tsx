"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-20"
      data-testid="error-boundary"
    >
      <div className="w-full max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
          ● AUTH FAULT
        </div>
        <h1 className="mt-4 font-display text-4xl text-white">
          Authentication <span className="italic text-brand">error</span>
        </h1>
        <p className="mt-4 font-display text-lg text-white/60">
          Something went wrong during authentication. It has been logged
          automatically.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
            Ref: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="border border-brand/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ↻ Retry
          </button>
          <Link
            href="/login"
            className="border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-white/40 hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ← Login
          </Link>
        </div>
      </div>
    </div>
  );
}
