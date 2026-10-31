"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyEmailAction } from "@/features/auth/actions";
import {
  AuthShell,
  authEyebrow,
  authPrimary,
  authSecondary,
} from "@/features/auth/components/AuthShell";

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
    <AuthShell>
      {status === "loading" && (
        <div>
          <p className={authEyebrow}>Email verification</p>
          <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">Verifying your email</h1>
          <p className="mt-2 text-[14px] leading-[21px] text-white/55">This only takes a moment.</p>
        </div>
      )}

      {status === "success" && (
        <div>
          <p className={`${authEyebrow} !text-up`}>Verified</p>
          <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">Email verified</h1>
          <p className="mt-2 text-[14px] leading-[21px] text-white/55">
            Your account is now active. You can log in.
          </p>
          <Link href="/login" className={`${authPrimary} mt-6 w-full`}>
            Go to login
          </Link>
        </div>
      )}

      {status === "error" && (
        <div>
          <p className={`${authEyebrow} !text-down`}>Failed</p>
          <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">Verification failed</h1>
          <p className="mt-2 text-[14px] leading-[21px] text-white/55">
            The link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/login" className={`${authSecondary} mt-6 w-full`}>
            Back to login
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
