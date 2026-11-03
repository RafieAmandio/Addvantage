import type { Metadata, Viewport } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { PaperAuthShell } from "@/features/auth/components/PaperAuth";

export const metadata: Metadata = { title: "Log in" };
export const viewport: Viewport = { themeColor: "#F4F3EF" };

export default function LoginPage() {
  return (
    <PaperAuthShell
      eyebrow="Operator login"
      title={
        <>
          Back to
          <br />
          the desk.
        </>
      }
      copy="Your session stays on this device. We don't track browsing history, and logging out clears everything."
    >
      <LoginForm />
    </PaperAuthShell>
  );
}
