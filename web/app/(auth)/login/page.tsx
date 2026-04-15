"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { useAppState } from "@/lib/state";

export default function LoginPage() {
  const router = useRouter();
  const { liabilitySigned } = useAppState();
  const [email, setEmail] = useState("operator@domain.local");
  const [pw, setPw] = useState("●●●●●●●●");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (liabilitySigned) {
      router.push("/app");
    } else {
      router.push("/signup/liability");
    }
  };

  return (
    <main className="relative mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-20">
      <div className="col-span-12 lg:col-span-5">
        <SectionNumber n="00 /" label="OPERATOR LOGIN" />
        <h1 className="mt-8 font-display text-6xl leading-[0.9] text-paper">
          Identify
          <br />
          <span className="italic text-amber">yourself.</span>
        </h1>
        <p className="mt-8 max-w-sm font-display text-lg text-paper/60">
          The DOMAIN does not store browsing history. Sessions are local.
          Logout clears the trace.
        </p>
        <div className="mt-12 border-l border-amber/30 pl-6 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
          <div>STATUS: TRANSMISSION LIVE</div>
          <div>NODE: 04 / 11 OPERATIONAL</div>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="col-span-12 border border-ink-3 bg-ink-2/40 p-10 lg:col-span-7"
      >
        <DataLabel>Credential entry · 02 fields</DataLabel>
        <div className="mt-6 space-y-6">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              Operator handle / email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border-b border-paper/20 bg-transparent py-3 font-mono text-lg text-paper outline-none transition-colors focus:border-amber"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              Authentication key
            </label>
            <input
              type="text"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="mt-2 w-full border-b border-paper/20 bg-transparent py-3 font-mono text-lg tracking-[0.3em] text-paper outline-none transition-colors focus:border-amber"
            />
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <Button type="submit" size="lg">
            AUTHENTICATE →
          </Button>
          <Link
            href="/signup"
            className="font-mono text-[10px] uppercase tracking-widest2 text-paper/50 hover:text-amber"
          >
            No clearance? Request access →
          </Link>
        </div>
        <div className="mt-12 border-t border-ink-3 pt-6 font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
          By authenticating you re-affirm the liability waiver signed at
          enrollment. ANTS retains no fiduciary duty.
        </div>
      </form>
    </main>
  );
}
