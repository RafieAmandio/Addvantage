"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { useAppState } from "@/lib/state";

export default function SignupPage() {
  const router = useRouter();
  const { setOperatorName } = useAppState();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: "",
    handle: "",
    experience: "",
  });

  const next = () => {
    if (step < 2) setStep(step + 1);
    else {
      // Persist whatever they typed as the display name; fallback to Operator
      const trimmed = form.handle.trim();
      if (trimmed.length > 0) setOperatorName(trimmed);
      router.push("/signup/liability");
    }
  };

  return (
    <main className="relative mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-20">
      <div className="col-span-12 lg:col-span-5">
        <SectionNumber n="00 /" label="ENROLLMENT" />
        <h1 className="mt-8 font-display text-6xl leading-[0.9] text-paper">
          This is a
          <br />
          <span className="italic text-amber">filter,</span>
          <br />
          not a funnel.
        </h1>
        <p className="mt-8 max-w-sm font-display text-lg text-paper/60">
          Three questions, then a liability waiver. If you can't get through
          the waiver, you're not who we built this for.
        </p>

        <div className="mt-12 space-y-3 font-mono text-[10px] uppercase tracking-widest2">
          {[
            { n: "01", label: "Identifier", done: step > 0 },
            { n: "02", label: "Self-classification", done: step > 1 },
            { n: "03", label: "Confirmation", done: step > 2 },
            { n: "04", label: "Liability waiver", done: false },
            { n: "05", label: "Trader profile", done: false },
          ].map((s, i) => (
            <div
              key={s.n}
              className={
                "flex items-center gap-3 " +
                (i === step
                  ? "text-amber"
                  : s.done
                  ? "text-paper/70"
                  : "text-paper/30")
              }
            >
              <span>{s.n}</span>
              <span className="h-px flex-1 bg-current opacity-30" />
              <span>{s.label}</span>
              {i === step && <span className="led amber" />}
              {s.done && <span className="text-moss">✓</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-12 border border-ink-3 bg-ink-2/40 p-10 lg:col-span-7">
        {step === 0 && (
          <div className="space-y-6 stagger">
            <DataLabel>Step 01 / Identifier</DataLabel>
            <h2 className="font-display text-3xl text-paper">
              How do we reach you?
            </h2>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="operator@domain.local"
                className="mt-2 w-full border-b border-paper/20 bg-transparent py-3 font-mono text-lg text-paper placeholder:text-paper/20 outline-none focus:border-amber"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                Operator handle (optional)
              </label>
              <input
                type="text"
                value={form.handle}
                onChange={(e) =>
                  setForm({ ...form, handle: e.target.value })
                }
                placeholder="operator-00417"
                className="mt-2 w-full border-b border-paper/20 bg-transparent py-3 font-mono text-lg text-paper placeholder:text-paper/20 outline-none focus:border-amber"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 stagger">
            <DataLabel>Step 02 / Self-classification</DataLabel>
            <h2 className="font-display text-3xl text-paper">
              How long have you been in markets?
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-widest2 text-amber">
              ANTS is not for beginners. We will hold you to this answer.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                "< 1 year",
                "1 — 3 years",
                "3 — 7 years",
                "7+ years",
                "Professional",
                "Other",
              ].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setForm({ ...form, experience: opt })}
                  className={
                    "border p-4 text-left font-mono text-xs uppercase tracking-widest2 transition-all " +
                    (form.experience === opt
                      ? "border-amber bg-amber/10 text-amber"
                      : "border-ink-3 text-paper/60 hover:border-amber/40 hover:text-paper")
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 stagger">
            <DataLabel>Step 03 / Confirmation</DataLabel>
            <h2 className="font-display text-3xl text-paper">
              Final confirmation.
            </h2>
            <div className="border border-amber/40 bg-amber/5 p-6 font-mono text-[11px] uppercase tracking-widest2 text-paper/80">
              <div className="mb-3 text-amber">YOU ARE ABOUT TO ATTEST:</div>
              <ul className="space-y-2">
                <li>· You are not a beginner.</li>
                <li>· You are not gambling.</li>
                <li>· You understand position sizing and risk.</li>
                <li>
                  · You will sign a liability waiver in the next step.
                </li>
              </ul>
            </div>
            <p className="text-sm text-paper/50">
              Press continue to proceed to the liability waiver. There is no
              way around this step.
            </p>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            disabled={step === 0}
            className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40 hover:text-amber disabled:opacity-30"
          >
            ← Back
          </button>
          <Button onClick={next} size="lg">
            {step < 2 ? "Continue →" : "Proceed to waiver →"}
          </Button>
        </div>
        <div className="mt-8 border-t border-ink-3 pt-4 text-center font-mono text-[9px] uppercase tracking-widest2 text-paper/30">
          Already enrolled?{" "}
          <Link href="/login" className="text-paper/60 hover:text-amber">
            Operator login →
          </Link>
        </div>
      </div>
    </main>
  );
}
