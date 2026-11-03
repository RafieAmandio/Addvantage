"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { StatusScreen } from "@/features/auth/components/StatusScreen";

export default function AdminError({
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
      eyebrow="Admin error"
      title="This admin page hit an error"
      body="An error interrupted this admin page. It has been logged automatically."
      digest={error.digest}
      actions={[
        { label: "Try again", onClick: () => reset(), primary: true },
        { label: "Review queue", href: "/admin/review" },
      ]}
    />
  );
}
