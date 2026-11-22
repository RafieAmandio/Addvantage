import Link from "next/link";
import { PaperAuthShell } from "@/features/auth/components/PaperAuth";
import { Roll } from "@/features/marketing/components/Roll";

// Public sign-up is invite-only for now: early access is the only way in.
// Shown at /signup when NEXT_PUBLIC_REGISTRATION_OPEN !== "1".
export function RegistrationClosed() {
  return (
    <PaperAuthShell>
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.03em]">Want early access?</h2>
      <p className="mt-3 text-[15px] text-tv-graphite">We read every application.</p>
      <Link href="/early-access" className="tv-btn tv-btn-ink mt-8 w-full">
        <Roll label="Apply for access" />
        <span aria-hidden className="tv-arrow">→</span>
      </Link>
      <p className="mt-8 border-t border-tv-stone pt-6 text-[15px] text-tv-graphite">
        Have an account?{" "}
        <Link href="/login" className="tv-link font-medium text-tv-ink">
          Log in
        </Link>
      </p>
    </PaperAuthShell>
  );
}
