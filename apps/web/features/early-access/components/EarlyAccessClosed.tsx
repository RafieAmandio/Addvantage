import Link from "next/link";
import { AuthShell, authEyebrow, authSecondary } from "@/features/auth/components/AuthShell";

// Shown while NEXT_PUBLIC_EARLY_ACCESS_OPEN === "0". Hard gate: the intake flow
// is never rendered, so no one can register until enrollment is opened.
export function EarlyAccessClosed() {
  return (
    <AuthShell>
      <p className={authEyebrow}>Applications on standby</p>
      <h1 className="mt-2 text-[22px] font-semibold leading-7 text-white">Not open yet</h1>
      <p className="mt-2 text-[14px] leading-[21px] text-white/55">
        Applications are sealed. They open shortly. If you were sent here, hold tight; your window is coming.
      </p>
      <Link href="/" className={`${authSecondary} mt-6 w-full`}>
        Back to TradeVantage
      </Link>
    </AuthShell>
  );
}
