import type { Metadata, Viewport } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { PaperAuthShell } from "@/features/auth/components/PaperAuth";

export const metadata: Metadata = { title: "Log in" };
export const viewport: Viewport = { themeColor: "#F4F3EF" };

export default function LoginPage() {
  return (
    <PaperAuthShell>
      <LoginForm />
    </PaperAuthShell>
  );
}
