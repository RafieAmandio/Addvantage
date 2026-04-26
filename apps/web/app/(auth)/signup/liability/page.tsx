"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataLabel } from "@/components/ui/Marker";
import { useAppState } from "@/lib/state";

export default function LiabilityPage() {
  const router = useRouter();
  const { signLiability, setTier } = useAppState();
  const [signature, setSignature] = useState("");
  const [acks, setAcks] = useState({
    a: false,
    b: false,
    c: false,
    d: false,
  });
  const allAcked = Object.values(acks).every(Boolean);
  const trimmed = signature.trim();
  const looksLikeFullName =
    trimmed.length >= 5 && /\s/.test(trimmed) && /^[\p{L}\s.'-]+$/u.test(trimmed);
  const canSign = allAcked && looksLikeFullName;
  const signatureError =
    signature.length > 0 && !looksLikeFullName
      ? trimmed.length < 5
        ? "Too short — type your full legal name."
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
    <main className="stagger relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="border border-brand/60 p-6 sm:p-12">
        <div className="flex items-center justify-between border-b border-brand/40 pb-4">
          <div>
            <DataLabel>Document W-001 · Final form</DataLabel>
            <div className="mt-1 font-display text-3xl text-white">
              Liability Release & Waiver
            </div>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            <div>VERSION 1.0</div>
            <div>2026 REVISION</div>
          </div>
        </div>

        <div className="mt-8 space-y-5 text-sm leading-relaxed text-white/80">
          <p className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            READ EVERY LINE. THIS DOCUMENT IS BINDING.
          </p>
          <p>
            By signing below, you (the "Operator") acknowledge and accept the
            following terms regarding your access to and use of ANTS — Alpha
            Network Trading System and its product surface, DOMAIN
            (Directional Outlook & Macro Alpha Intelligence) (collectively,
            the "Platform"):
          </p>
          <ol className="space-y-4 border-l border-brand/40 pl-6">
            <li>
              <strong className="font-display italic text-brand">
                01. Not investment advice.
              </strong>{" "}
              All content delivered through the Platform — including news,
              calendar entries, trading plans, consultation responses,
              education, and channel posts — is provided for informational
              purposes only and does not constitute investment, financial, or
              tax advice.
            </li>
            <li>
              <strong className="font-display italic text-brand">
                02. No fiduciary duty.
              </strong>{" "}
              ANTS does not act as a financial advisor, broker, or fiduciary.
              ANTS does not manage funds and does not execute trades on your
              behalf.
            </li>
            <li>
              <strong className="font-display italic text-brand">
                03. Trading risk acknowledgement.
              </strong>{" "}
              You understand that trading and investing carry substantial
              risk of loss, including the loss of your entire principal. Past
              performance is not indicative of future results.
            </li>
            <li>
              <strong className="font-display italic text-brand">
                04. Sole responsibility.
              </strong>{" "}
              You are solely responsible for any decision to act, or refrain
              from acting, on information presented through the Platform.
              ANTS, its operators, authors, and affiliates shall have no
              liability for any losses, damages, or expenses you may incur.
            </li>
            <li>
              <strong className="font-display italic text-brand">
                05. Operator self-classification.
              </strong>{" "}
              You attest that you are an experienced market participant. You
              are not a beginner, you are not gambling, and you understand
              position sizing and invalidation. You will not hold ANTS
              responsible for outcomes that result from operating outside
              your competence.
            </li>
          </ol>
        </div>

        <div className="mt-10 space-y-3 border-t border-gray-3 pt-8">
          <DataLabel>Acknowledgements (all required)</DataLabel>
          {[
            { k: "a", label: "I understand this is not investment advice." },
            {
              k: "b",
              label: "I accept full responsibility for my own trading decisions.",
            },
            {
              k: "c",
              label: "I confirm I am not a beginner, gambler, or hobbyist.",
            },
            {
              k: "d",
              label:
                "I release ANTS, its operators, and affiliates from any liability for trading losses.",
            },
          ].map((a) => (
            <label
              key={a.k}
              className="flex cursor-pointer items-start gap-3 border border-gray-3 p-4 transition-colors hover:border-brand/40"
            >
              <input
                type="checkbox"
                checked={(acks as Record<string, boolean>)[a.k]}
                onChange={(e) =>
                  setAcks({ ...acks, [a.k]: e.target.checked })
                }
                className="mt-1 h-4 w-4 accent-[#FFD400]"
              />
              <span className="font-mono text-[11px] uppercase tracking-widest2 text-white/80">
                {a.label}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-8">
          <DataLabel>Signature · type your full legal name</DataLabel>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Your full legal name"
            className={
              "mt-2 w-full border-b-2 bg-transparent py-3 font-display text-3xl italic outline-none transition-colors " +
              (signatureError
                ? "border-blood text-red-500"
                : looksLikeFullName
                ? "border-moss text-moss"
                : "border-brand/40 text-brand focus:border-brand")
            }
          />
          {signatureError && (
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-red-500">
              ● {signatureError}
            </div>
          )}
          <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            <span suppressHydrationWarning>
              Signed at: {new Date().toUTCString()}
            </span>
            <span>Doc · W-001 · v1.0</span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-gray-3 pt-6">
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            {canSign ? (
              <span className="text-moss">● READY TO SIGN</span>
            ) : (
              <span className="text-red-500">● INCOMPLETE</span>
            )}
          </span>
          <Button onClick={submit} disabled={!canSign} size="lg">
            {canSign ? "SIGN & ENTER DOMAIN →" : "COMPLETE ALL FIELDS"}
          </Button>
        </div>
      </div>
    </main>
  );
}
