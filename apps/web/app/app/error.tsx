"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { StatusScreen } from "@/features/auth/components/StatusScreen";

export default function AppError({
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
    <div className="px-4 sm:px-6">
      <StatusScreen
        eyebrow="Something went wrong"
        title="This page hit an error"
        body="An error interrupted this page. It has been logged automatically."
        digest={error.digest}
        actions={[
          { label: "Try again", onClick: () => reset(), primary: true },
          { label: "Dashboard", href: "/app" },
        ]}
      />
    </div>
  );
}
