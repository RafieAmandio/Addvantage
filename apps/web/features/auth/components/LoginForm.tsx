"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/Button";
import { DataLabel } from "@/components/ui/Marker";
import {
  requestLoginOtp,
  type LoginActionState,
} from "@/features/auth/actions";

const INITIAL_STATE: LoginActionState = { ok: false };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "That email doesn't look right.",
  rate_limited: "Too many attempts. Try again in a minute.",
  send_failed: "Something went wrong. Try again.",
};

export function LoginForm() {
  const [state, formAction] = useFormState(requestLoginOtp, INITIAL_STATE);

  if (state.sent) {
    return (
      <div className="col-span-12 border border-gray-3 bg-black-2/40 p-10 lg:col-span-7">
        <DataLabel>Transmission dispatched</DataLabel>
        <div className="mt-6 font-display text-2xl text-white">
          Magic link dispatched to{" "}
          <span className="italic text-brand">{state.email}</span>.
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-widest2 text-white/50">
          Check your inbox. It expires in 15 minutes.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/signup"
            className="font-mono text-[10px] uppercase tracking-widest2 text-white/50 hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            No clearance? Request access →
          </Link>
        </div>
        <div className="mt-12 border-t border-gray-3 pt-6 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
          By authenticating you re-affirm the liability waiver signed at
          enrollment. ANTS retains no fiduciary duty.
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="col-span-12 border border-gray-3 bg-black-2/40 p-10 lg:col-span-7"
    >
      <DataLabel>Credential entry · 01 field</DataLabel>
      <div className="mt-6 space-y-6">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            Operator email
          </label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            defaultValue={state.email ?? ""}
            className="mt-2 w-full border-b border-white/20 bg-transparent py-3 font-mono text-lg text-white outline-none transition-colors focus-visible:border-brand"
          />
          {state.error ? (
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
              {ERROR_MESSAGES[state.error] ?? "Something went wrong."}
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <Button type="submit" size="lg">
          AUTHENTICATE →
        </Button>
        <Link
          href="/signup"
          className="font-mono text-[10px] uppercase tracking-widest2 text-white/50 hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
        >
          No clearance? Request access →
        </Link>
      </div>
      <div className="mt-12 border-t border-gray-3 pt-6 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
        By authenticating you re-affirm the liability waiver signed at
        enrollment. ANTS retains no fiduciary duty.
      </div>
    </form>
  );
}
