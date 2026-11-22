"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { verifyEmailAction, resendVerificationAction } from "@/features/auth/actions";
import { PaperAuthShell, PaperButton, VerifyStatus } from "@/features/auth/components/PaperAuth";
import { Roll } from "@/features/marketing/components/Roll";

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");

  const [status, setStatus] = useState<"waiting" | "verifying" | "success" | "error">(token ? "verifying" : "waiting");
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    verifyEmailAction(token).then((result) => {
      setStatus(result.ok ? "success" : "error");
    });
  }, [token]);

  const handleResend = async () => {
    setResending(true);
    const result = await resendVerificationAction();
    setResending(false);
    if (result.ok) setResent(true);
  };

  return (
    <PaperAuthShell>
      {status === "waiting" && (
        <VerifyStatus eyebrow="Verification pending" title="Confirm your email">
          {email && (
            <p className="text-[15px] leading-[1.55] text-tv-graphite">
              We sent a link to <span className="font-mono text-tv-ink">{email}</span>
            </p>
          )}
          <p className="text-[15px] leading-[1.55] text-tv-graphite">Click the link in the email to verify your account. Once verified, you can log in and proceed to the liability waiver.</p>
          <div className="space-y-3 pt-4">
            <Link href="/login" className="tv-btn tv-btn-ink w-full">
              <Roll label="I've verified, go to login" />
              <span aria-hidden className="tv-arrow">→</span>
            </Link>
            {!resent ? (
              <PaperButton type="button" onClick={handleResend} busy={resending} label="Didn't receive it? Resend" busyLabel="Resending" variant="line" className="w-full" />
            ) : (
              <p role="status" className="lv-in flex min-h-[48px] items-center justify-center gap-2.5 rounded-[10px] border border-tv-ink text-[15px]">
                <Tick /> Verification email resent.
              </p>
            )}
          </div>
        </VerifyStatus>
      )}

      {status === "verifying" && (
        <VerifyStatus eyebrow="Verifying" title="Checking your link" busy>
          <p className="text-[15px] leading-[1.55] text-tv-graphite">Confirming your email address.</p>
        </VerifyStatus>
      )}

      {status === "success" && (
        <VerifyStatus eyebrow="Verified" title="Email confirmed">
          <p className="text-[15px] leading-[1.55] text-tv-graphite">Your identity has been confirmed. You can now log in and proceed to the liability waiver.</p>
          <Link href="/login" className="tv-btn tv-btn-ink mt-4 w-full">
            <Roll label="Proceed to login" />
            <span aria-hidden className="tv-arrow">→</span>
          </Link>
        </VerifyStatus>
      )}

      {status === "error" && (
        <VerifyStatus eyebrow="Failed" title="Verification failed" failed>
          <p className="text-[15px] leading-[1.55] text-tv-graphite">The link may have expired or already been used. Request a new one.</p>
          <div className="space-y-3 pt-4">
            <Link href="/signup" className="tv-btn tv-btn-ink w-full">
              <Roll label="Try again" />
              <span aria-hidden className="tv-arrow">→</span>
            </Link>
            <Link href="/login" className="tv-btn tv-btn-line w-full">
              Go to login
            </Link>
          </div>
        </VerifyStatus>
      )}
    </PaperAuthShell>
  );
}

function Tick() {
  return (
    <svg aria-hidden viewBox="0 0 14 14" className="h-3.5 w-3.5">
      <path d="M2 7.5l3.2 3L12 3.5" fill="none" stroke="#111214" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
