import Link from "next/link";
import { AuthShell, authEyebrow, authPrimary } from "./AuthShell";

// Public sign-up is invite-only for now: early access is the only way in.
// Shown at /signup when NEXT_PUBLIC_REGISTRATION_OPEN !== "1".
export function RegistrationClosed() {
  return (
    <AuthShell
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-white hover:text-brand">
            Sign in
          </Link>
        </>
      }
    >
      <p className={authEyebrow}>Invite only</p>
      <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">Public sign-up is paused</h1>
      <p className="mt-2 text-[14px] leading-[21px] text-white/55">
        The only way in right now is early access: a founding cohort with a 100% money-back guarantee.
      </p>
      <Link href="/early-access" className={`${authPrimary} mt-6 w-full`}>
        Request early access
      </Link>
    </AuthShell>
  );
}
