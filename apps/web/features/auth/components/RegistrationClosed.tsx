import Link from "next/link";
import { PaperAuthShell } from "@/features/auth/components/PaperAuth";
import { Roll } from "@/features/marketing/components/Roll";

// Public sign-up is invite-only for now: early access is the only way in.
// Shown at /signup when NEXT_PUBLIC_REGISTRATION_OPEN !== "1".
export function RegistrationClosed() {
  return (
    <PaperAuthShell
      scene="signup"
      eyebrow="Registration / Invite only"
      title={
        <>
          Invite
          <br />
          only.
        </>
      }
      copy="Public sign-up is paused. The only way in right now is early access: a founding cohort with a 100% money-back guarantee."
    >
      <p className="tv-eyebrow text-tv-mute">Request access</p>
      <h2 className="mt-3 text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]">Apply for early access</h2>
      <p className="mt-4 text-[15px] leading-[1.55] text-tv-graphite">
        Tell the desk how you trade. Every application is read before access is granted.
      </p>
      <Link href="/early-access" className="tv-btn tv-btn-ink mt-8 w-full">
        <Roll label="Request early access" />
        <span aria-hidden className="tv-arrow">→</span>
      </Link>
      <p className="mt-8 border-t border-tv-stone pt-6 text-[15px] text-tv-graphite">
        Already an operator?{" "}
        <Link href="/login" className="tv-link font-medium text-tv-ink">
          Sign in
        </Link>
      </p>
    </PaperAuthShell>
  );
}
