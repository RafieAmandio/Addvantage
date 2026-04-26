"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { ClassificationStripe } from "@/components/ui/Classification";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[app/error]", error);
  }, [error]);

  return (
    <main className="grain min-h-screen bg-black text-white">
      <ClassificationStripe label="TRANSMISSION FAULT // RUNTIME ERROR" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-start px-6 py-32">
        <div className="absolute -right-32 top-12 h-[24rem] w-[24rem] rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute inset-0 bg-grid opacity-40" />

        <div className="relative">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            STATUS · 500 · SIGNAL DEGRADED
          </div>

          <div className="mt-6 font-display text-[14rem] font-medium leading-[0.8] tracking-tightest text-white/15">
            500
          </div>

          <h1 className="mt-2 font-display text-6xl leading-[0.95] text-white">
            The DOMAIN
            <br />
            <span className="italic text-brand">hit turbulence</span>
            <br />
            rerouting now.
          </h1>

          <p className="mt-8 max-w-lg font-display text-xl text-white/60">
            An unexpected fault interrupted the render. Telemetry has been
            captured. Try again, or return to a known surface.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button size="lg" onClick={() => reset()}>
              ↻ RETRY TRANSMISSION
            </Button>
            <Link href="/">
              <Button variant="outline" size="lg">
                RETURN TO BRIEF
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-6 border-t border-gray-3 pt-8 font-mono text-[10px] uppercase tracking-widest2 text-white/40 sm:grid-cols-4">
            <div>
              <div className="text-brand">REQUEST</div>
              <div className="mt-1">FAULTED</div>
            </div>
            <div>
              <div className="text-brand">NODE</div>
              <div className="mt-1">05 / 11</div>
            </div>
            <div>
              <div className="text-brand">CHANNEL</div>
              <div className="mt-1">DOMAIN</div>
            </div>
            <div>
              <div className="text-brand">DIGEST</div>
              <div className="mt-1">{error.digest ?? "LOCAL"}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
