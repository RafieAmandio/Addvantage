"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useAppState } from "@/lib/state";
import { PaperAuthShell, PaperButton, PaperField, PaperInput, paperErr } from "@/features/auth/components/PaperAuth";

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
    <PaperAuthShell
      scene="waiver"
      eyebrow="Liability waiver"
      title={
        <>
          Read every
          <br />
          line.
        </>
      }
      copy="This document is binding. If you don't agree, close the tab."
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="tv-eyebrow text-tv-mute">Document W-001</p>
        <p className="tv-eyebrow text-tv-mute">Final form</p>
      </div>
      <h2 className="mt-3 text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]">Liability release and waiver</h2>

      <div className="mt-6 space-y-4 text-[15px] leading-[1.55] text-tv-graphite">
        <p>
          By signing below, you (the &ldquo;Operator&rdquo;) acknowledge and accept the following terms regarding your access to TradeVantage:
        </p>
        <ol className="border-t border-tv-ink">
          {[
            ["01", "Not investment advice.", "All content is for informational purposes only and does not constitute investment, financial, or tax advice."],
            ["02", "No fiduciary duty.", "TradeVantage does not act as a financial advisor, broker, or fiduciary. TradeVantage does not manage funds."],
            ["03", "Trading risk acknowledgement.", "Trading carries substantial risk of loss, including your entire principal. Past performance is not indicative of future results."],
            ["04", "Sole responsibility.", "You are solely responsible for any decision to act on information from the Platform. TradeVantage shall have no liability."],
            ["05", "Operator self-classification.", "You attest that you are an experienced market participant. You are not a beginner."],
          ].map(([n, t, d]) => (
            <li key={n} className="flex gap-4 border-b border-tv-stone py-3.5">
              <span className="font-mono text-[12px] tabular-nums leading-[1.9] text-tv-mute">{n}</span>
              <span>
                <strong className="font-semibold text-tv-ink">{t}</strong> {d}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <fieldset className="mt-8">
        <legend className="text-[15px] font-medium">Acknowledgements (all required)</legend>
        <div className="mt-3 border-t border-tv-stone">
          {[
            { k: "a", label: "I understand this is not investment advice." },
            { k: "b", label: "I accept full responsibility for my own trading decisions." },
            { k: "c", label: "I confirm I am not a beginner, gambler, or hobbyist." },
            { k: "d", label: "I release TradeVantage and affiliates from any liability for trading losses." },
          ].map((a) => (
            <label key={a.k} className="flex cursor-pointer items-start gap-3.5 border-b border-tv-stone py-3.5">
              <input
                type="checkbox"
                checked={acks[a.k]}
                onChange={(e) => setAcks({ ...acks, [a.k]: e.target.checked })}
                className="mt-[3px] h-4 w-4 shrink-0 accent-tv-ink"
              />
              <span className="text-[15px] leading-[1.5]">{a.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-8">
        <PaperField id="waiver-signature" label="Signature: type your full legal name">
          <PaperInput
            id="waiver-signature"
            type="text"
            autoComplete="name"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Your full legal name"
            valid={looksLikeFullName}
            aria-invalid={!!signatureError || undefined}
            aria-describedby={signatureError ? "waiver-signature-error" : undefined}
            className="font-serif text-[22px] italic"
          />
        </PaperField>
        {signatureError && (
          <p id="waiver-signature-error" className={paperErr}>
            {signatureError}
          </p>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-tv-stone pt-6">
        <span className={cn("flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em]", canSign ? "text-tv-ink" : "text-tv-mute")}>
          <span aria-hidden className={cn("h-2.5 w-2.5 rounded-[3px]", canSign ? "bg-tv-ink" : "border border-tv-mute")} />
          {canSign ? "Ready to sign" : "Incomplete"}
        </span>
        <PaperButton type="button" busy={false} busyLabel="" onClick={submit} disabled={!canSign} label={canSign ? "Sign and enter" : "Complete all fields"} />
      </div>
    </PaperAuthShell>
  );
}
