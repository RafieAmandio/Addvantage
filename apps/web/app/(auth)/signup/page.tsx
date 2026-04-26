import type { Metadata } from "next";
import { SignupWizard } from "@/features/auth/components/SignupWizard";

export const metadata: Metadata = { title: "Sign Up" };

export default function SignupPage() {
  return <SignupWizard />;
}
