"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { StatusScreen } from "@/features/auth/components/StatusScreen";

export default function EarlyAccessError({
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
      eyebrow="Something went wrong"
      title="The intake could not load"
      body="It has been logged. Try again in a moment."
      digest={error.digest}
      actions={[
        { label: "Try again", onClick: () => reset(), primary: true },
        { label: "Home", href: "/" },
      ]}
    />
  );
}
