import type { Metadata } from "next";
import { SignupWizard } from "@/features/auth/components/SignupWizard";

export const metadata: Metadata = { title: "Request Access — DOMAIN" };

export default function SignupPage() {
  return <SignupWizard />;
}
