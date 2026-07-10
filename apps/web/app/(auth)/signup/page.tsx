import type { Metadata } from "next";
import { SignupWizard } from "@/features/auth/components/SignupWizard";
import { RegistrationClosed } from "@/features/auth/components/RegistrationClosed";

export const metadata: Metadata = { title: "Request Access — DOMAIN" };

// Public registration is invite-only for now — early access is the only way in.
// Set NEXT_PUBLIC_REGISTRATION_OPEN=1 at build time to reopen public sign-up.
const REGISTRATION_OPEN = process.env.NEXT_PUBLIC_REGISTRATION_OPEN === "1";

export default function SignupPage() {
  return REGISTRATION_OPEN ? <SignupWizard /> : <RegistrationClosed />;
}
