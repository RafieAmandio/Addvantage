"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function EarlyAccessError({
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
        ● Channel fault
      </div>
      <h1 className="mt-4 font-sans text-4xl font-bold text-white">
        Something <span className="italic text-brand">broke</span>
      </h1>
      <p className="mt-4 max-w-sm font-mono text-sm text-white/60">
        The intake could not load. It has been logged. Try again in a moment.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="border border-brand/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black"
        >
          ↻ Retry
        </button>
        <Link
          href="/"
          className="border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-white/40 hover:text-white"
        >
          ← Home
        </Link>
      </div>
    </div>
  );
}
