"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useAppState } from "@/lib/state";
import { AuthShell, authEyebrow, authLabel, authPrimary } from "@/features/auth/components/AuthShell";

export default function LiabilityPage() {
  const router = useRouter();
  const { signLiability, setTier } = useAppState();
  const [signature, setSignature] = useState("");
  const [acks, setAcks] = useState<Record<string, boolean>>({
    a: false,
    b: false,
    c: false,
    d: false,
  });
  const allAcked = Object.values(acks).every(Boolean);
  const trimmed = signature.trim();
  const looksLikeFullName =
    trimmed.length >= 5 &&
    /\s/.test(trimmed) &&
    /^[\p{L}\s.'-]+$/u.test(trimmed);
  const canSign = allAcked && looksLikeFullName;
  const signatureError =
    signature.length > 0 && !looksLikeFullName
      ? trimmed.length < 5
        ? "Too short. Type your full legal name."
        : !/\s/.test(trimmed)
          ? "Need first AND last name."
          : "Letters, spaces, and . - ' only."
      : null;

  const submit = () => {
    if (!canSign) return;
    signLiability();
    setTier("free");
    router.push("/signup/profile");
  };

  return (
    <AuthShell width="lg">
      <p className={authEyebrow}>Document W-001 · Final form</p>
      <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">Liability release and waiver</h1>
      <p className="mt-2 text-[14px] leading-[21px] text-white/55">
        Read every line. This document is binding. If you don&apos;t agree, close the tab.
      </p>

      <div className="mt-6 space-y-4 text-[14px] leading-[22px] text-white/70">
        <p>
          By signing below, you (the &ldquo;Operator&rdquo;) acknowledge and accept the following terms
          regarding your access to TradeVantage:
        </p>
        <ol className="divide-y divide-white/[0.07]">
          {[
            ["Not investment advice.", "All content is for informational purposes only and does not constitute investment, financial, or tax advice."],
            ["No fiduciary duty.", "TradeVantage does not act as a financial advisor, broker, or fiduciary. TradeVantage does not manage funds."],
            ["Trading risk acknowledgement.", "Trading carries substantial risk of loss, including your entire principal. Past performance is not indicative of future results."],
            ["Sole responsibility.", "You are solely responsible for any decision to act on information from the Platform. TradeVantage shall have no liability."],
            ["Operator self-classification.", "You attest that you are an experienced market participant. You are not a beginner."],
          ].map(([title, text], i) => (
            <li key={title} className="flex gap-3 py-3">
              <span className="w-4 shrink-0 font-num text-[15px] font-semibold text-white/40">{i + 1}</span>
              <span>
                <strong className="font-medium text-white">{title}</strong> {text}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6">
        <p className={authLabel}>Acknowledgements (all required)</p>
        <div className="mt-2 divide-y divide-white/[0.07]">
          {[
            {
              k: "a",
              label: "I understand this is not investment advice.",
            },
            {
              k: "b",
              label:
                "I accept full responsibility for my own trading decisions.",
            },
            {
              k: "c",
              label:
                "I confirm I am not a beginner, gambler, or hobbyist.",
            },
            {
              k: "d",
              label:
                "I release TradeVantage and affiliates from any liability for trading losses.",
            },
          ].map((a) => (
            <label key={a.k} className="flex cursor-pointer items-start gap-3 py-3">
              <input
                type="checkbox"
                checked={acks[a.k]}
                onChange={(e) =>
                  setAcks({ ...acks, [a.k]: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
              />
              <span className={cn("text-[14px] leading-[21px]", acks[a.k] ? "text-white" : "text-white/70")}>
                {a.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="signature" className={authLabel}>
          Signature, type your full legal name
        </label>
        <input
          id="signature"
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Your full legal name"
          className={cn(
            "mt-2 h-12 w-full rounded-xl bg-raised px-4 font-serif text-[20px] italic text-white outline-none ring-1 placeholder:text-white/25 focus-visible:ring-brand",
            signatureError ? "ring-down" : looksLikeFullName ? "ring-up" : "ring-white/[0.08]"
          )}
        />
        {signatureError && (
          <p className="mt-2 text-[13px] text-down">{signatureError}</p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <span className={cn("text-[13px]", canSign ? "text-up" : "text-white/40")}>
          {canSign ? "Ready to sign" : "Incomplete"}
        </span>
        <button onClick={submit} disabled={!canSign} className={authPrimary}>
          {canSign ? "Sign and enter" : "Complete all fields"}
        </button>
      </div>
    </AuthShell>
  );
}
