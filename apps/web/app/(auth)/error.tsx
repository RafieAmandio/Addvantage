"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { StatusScreen } from "@/features/auth/components/StatusScreen";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <StatusScreen
      page
      eyebrow="Authentication error"
      title="Something went wrong"
      body="Something went wrong during authentication. It has been logged automatically."
      digest={error.digest}
      actions={[
        { label: "Try again", onClick: () => reset(), primary: true },
        { label: "Login", href: "/login" },
      ]}
    />
  );
}
