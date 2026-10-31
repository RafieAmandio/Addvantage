"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  verifyEmailAction,
  resendVerificationAction,
} from "@/features/auth/actions";
import {
  AuthShell,
  authEyebrow,
  authPrimary,
  authSecondary,
} from "@/features/auth/components/AuthShell";

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");

  const [status, setStatus] = useState<
    "waiting" | "verifying" | "success" | "error"
  >(token ? "verifying" : "waiting");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;
    verifyEmailAction(token).then((result) => {
      setStatus(result.ok ? "success" : "error");
    });
  }, [token]);

  const handleResend = async () => {
    const result = await resendVerificationAction();
    if (result.ok) setResent(true);
  };

  return (
    <AuthShell>
      {status === "waiting" && (
        <div>
          <p className={authEyebrow}>Verification pending</p>
          <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">Check your inbox</h1>
          {email && (
            <p className="mt-2 text-[14px] leading-[21px] text-white/55">
              We sent a link to <span className="font-medium text-white">{email}</span>
            </p>
          )}
          <p className="mt-2 text-[14px] leading-[21px] text-white/55">
            Click the link in the email to verify your account. Once verified, you can log in and
            proceed to the liability waiver.
          </p>

          <div className="mt-6 space-y-3">
            <Link href="/login" className={`${authPrimary} w-full`}>
              I&apos;ve verified, go to login
            </Link>
            {!resent ? (
              <button type="button" onClick={handleResend} className={`${authSecondary} w-full`}>
                Didn&apos;t receive it? Resend
              </button>
            ) : (
              <p role="status" className="py-3 text-center text-[13px] text-up">
                Verification email resent.
              </p>
            )}
          </div>
        </div>
      )}

      {status === "verifying" && (
        <div>
          <p className={authEyebrow}>Verifying</p>
          <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">Confirming your email</h1>
          <p className="mt-2 text-[14px] leading-[21px] text-white/55">This only takes a moment.</p>
        </div>
      )}

      {status === "success" && (
        <div>
          <p className={`${authEyebrow} !text-up`}>Verified</p>
          <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">Email confirmed</h1>
          <p className="mt-2 text-[14px] leading-[21px] text-white/55">
            You can now log in and proceed to the liability waiver.
          </p>
          <Link href="/login" className={`${authPrimary} mt-6 w-full`}>
            Proceed to login
          </Link>
        </div>
      )}

      {status === "error" && (
        <div>
          <p className={`${authEyebrow} !text-down`}>Failed</p>
          <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">Verification failed</h1>
          <p className="mt-2 text-[14px] leading-[21px] text-white/55">
            The link may have expired or already been used. Request a new one.
          </p>
          <div className="mt-6 space-y-3">
            <Link href="/signup" className={`${authPrimary} w-full`}>
              Try again
            </Link>
            <Link href="/login" className={`${authSecondary} w-full`}>
              Go to login
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
