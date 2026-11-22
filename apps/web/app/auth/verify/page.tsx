"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyEmailAction } from "@/features/auth/actions";
import { PaperAuthShell, VerifyStatus } from "@/features/auth/components/PaperAuth";
import { Roll } from "@/features/marketing/components/Roll";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    verifyEmailAction(token).then((res) => {
      setStatus(res.ok ? "success" : "error");
    });
  }, [token]);

  return (
    <PaperAuthShell>
      {status === "loading" && (
        <VerifyStatus eyebrow="Verifying" title="Checking your link" busy>
          <p className="text-[15px] leading-[1.55] text-tv-graphite">Verifying your email.</p>
        </VerifyStatus>
      )}

      {status === "success" && (
        <VerifyStatus eyebrow="Verified" title="Email verified">
          <p className="text-[15px] leading-[1.55] text-tv-graphite">Your account is now active. You can log in.</p>
          <Link href="/login" className="tv-btn tv-btn-ink mt-4 w-full">
            <Roll label="Go to login" />
            <span aria-hidden className="tv-arrow">→</span>
          </Link>
        </VerifyStatus>
      )}

      {status === "error" && (
        <VerifyStatus eyebrow="Failed" title="Verification failed" failed>
          <p className="text-[15px] leading-[1.55] text-tv-graphite">The link is invalid or has expired. Please request a new one.</p>
          <Link href="/login" className="tv-btn tv-btn-line mt-4 w-full">
            Back to login
          </Link>
        </VerifyStatus>
      )}
    </PaperAuthShell>
  );
}
