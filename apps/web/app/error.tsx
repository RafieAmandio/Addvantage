"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { StatusScreen } from "@/features/auth/components/StatusScreen";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[app/error]", error);
  }, [error]);

  return (
    <StatusScreen
      page
      code="500"
      eyebrow="Something went wrong"
      title="This page hit an error"
      body="An unexpected fault interrupted the page. It has been logged. Try again, or go back home."
      digest={error.digest}
      actions={[
        { label: "Try again", onClick: () => reset(), primary: true },
        { label: "Home", href: "/" },
      ]}
    />
  );
}
