"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SectionNumber } from "@/components/ui/Marker";
import { verifyEmailAction } from "@/features/auth/actions";

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
    <main className="stagger relative mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-12 sm:px-6 sm:py-20">
      <div className="col-span-12 lg:col-span-5">
        <SectionNumber n="00 /" label="VERIFICATION" />
        <h1 className="mt-8 font-display text-6xl leading-[0.9] text-white">
          Email
          <br />
          <span className="italic text-brand">verification.</span>
        </h1>
      </div>

      <div className="col-span-12 border border-gray-3 bg-black-2/40 p-10 lg:col-span-7">
        {status === "loading" && (
          <div className="font-mono text-[11px] uppercase tracking-widest2 text-white/60">
            Verifying your email...
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="font-display text-2xl text-white">
              Email <span className="text-moss">verified</span>.
            </div>
            <p className="font-mono text-[11px] uppercase tracking-widest2 text-white/60">
              Your account is now active. You can log in.
            </p>
            <Link
              href="/login"
              className="inline-block border border-brand bg-brand/10 px-6 py-3 font-mono text-xs uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Go to login &rarr;
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="font-display text-2xl text-white">
              Verification <span className="text-blood-bright">failed</span>.
            </div>
            <p className="font-mono text-[11px] uppercase tracking-widest2 text-white/60">
              The link is invalid or has expired. Please request a new one.
            </p>
            <Link
              href="/login"
              className="inline-block border border-gray-3 px-6 py-3 font-mono text-xs uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Back to login &rarr;
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
