"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useAppState } from "@/lib/state";

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
          <span className="font-bold text-white">Liability Waiver</span>
        </div>

        <div className="relative z-10 mt-auto">
          <h1 className="font-sans text-[clamp(2.5rem,7vw,72px)] font-bold leading-[0.95] text-white">
            Read every
            <br />
            <span className="text-brand">line.</span>
          </h1>
          <p className="mt-6 max-w-sm font-mono text-sm font-light leading-[1.5] text-white/60">
            This document is binding. If you don&apos;t agree, close the tab.
          </p>
        </div>
      </div>

      {/* Right — waiver form */}
      <div className="flex flex-col bg-white px-6 py-12 md:overflow-y-auto md:px-12">
        <div className="mx-auto w-full max-w-lg">
          <p className="font-mono text-sm text-black/50">
            Document W-001 · Final form
          </p>
          <h2 className="mt-2 font-mono text-xl font-bold text-black">
            Liability Release & Waiver
          </h2>

          <div className="mt-8 space-y-4 font-mono text-sm leading-relaxed text-black/70">
            <p className="font-bold text-brand">
              READ EVERY LINE. THIS DOCUMENT IS BINDING.
            </p>
            <p>
              By signing below, you (the &ldquo;Operator&rdquo;) acknowledge and
              accept the following terms regarding your access to TradeVantage:
            </p>
            <ol className="space-y-4 border-l-2 border-brand/30 pl-6">
              <li>
                <strong className="text-black">01. Not investment advice.</strong>{" "}
                All content is for informational purposes only and does not
                constitute investment, financial, or tax advice.
              </li>
              <li>
                <strong className="text-black">02. No fiduciary duty.</strong>{" "}
                TradeVantage does not act as a financial advisor, broker, or fiduciary.
                TradeVantage does not manage funds.
              </li>
              <li>
                <strong className="text-black">
                  03. Trading risk acknowledgement.
                </strong>{" "}
                Trading carries substantial risk of loss, including your entire
                principal. Past performance is not indicative of future results.
              </li>
              <li>
                <strong className="text-black">04. Sole responsibility.</strong>{" "}
                You are solely responsible for any decision to act on
                information from the Platform. TradeVantage shall have no liability.
              </li>
              <li>
                <strong className="text-black">
                  05. Operator self-classification.
                </strong>{" "}
                You attest that you are an experienced market participant. You
                are not a beginner.
              </li>
            </ol>
          </div>

          <div className="mt-8 space-y-3">
            <p className="font-mono text-sm font-bold text-black">
              Acknowledgements (all required)
            </p>
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
              <label
                key={a.k}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                  acks[a.k]
                    ? "border-brand bg-brand/5"
                    : "border-gray-3 hover:border-black/30"
                )}
              >
                <input
                  type="checkbox"
                  checked={acks[a.k]}
                  onChange={(e) =>
                    setAcks({ ...acks, [a.k]: e.target.checked })
                  }
                  className="mt-0.5 h-4 w-4 accent-brand"
                />
                <span className="font-mono text-sm text-black/70">
                  {a.label}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-8">
            <p className="font-mono text-sm font-bold text-black">
              Signature — type your full legal name
            </p>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Your full legal name"
              className={cn(
                "mt-2 w-full rounded-lg border px-4 py-3 font-serif text-2xl italic outline-none transition-colors",
                signatureError
                  ? "border-blood-bright bg-blood/5 text-blood-bright"
                  : looksLikeFullName
                    ? "border-moss bg-moss/5 text-black"
                    : "border-gray-3 bg-white-2 text-black placeholder:text-black/30 focus-visible:border-brand"
              )}
            />
            {signatureError && (
              <p className="mt-2 font-mono text-xs text-blood-bright">
                {signatureError}
              </p>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <span className="font-mono text-xs text-black/40">
              {canSign ? (
                <span className="text-moss">● Ready to sign</span>
              ) : (
                <span className="text-blood-bright">● Incomplete</span>
              )}
            </span>
            <button
              onClick={submit}
              disabled={!canSign}
              className="btn-pixel rounded-lg bg-brand px-6 py-3 font-mono text-sm font-bold text-black transition-colors hover:bg-brand-dim disabled:opacity-40"
            >
              {canSign ? "Sign & Enter →" : "Complete All Fields"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
