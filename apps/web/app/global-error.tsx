"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry.captureException is a no-op when NEXT_PUBLIC_SENTRY_DSN is unset.
    Sentry.captureException(error);
    console.error("[app/global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#111111",
          color: "#EEEEEE",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#FFD400",
            }}
          >
            STATUS · 500 · ROOT FAULT
          </div>
          <h1
            style={{
              marginTop: "0.75rem",
              fontSize: "2.5rem",
              lineHeight: 1.05,
              fontWeight: 500,
            }}
          >
            The DOMAIN is offline.
          </h1>
          <p style={{ marginTop: "1rem", color: "rgba(238,238,238,0.6)" }}>
            A root-level fault took down the shell. Reload to retry.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.25rem",
              background: "#FFD400",
              color: "#111111",
              border: 0,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              cursor: "pointer",
            }}
          >
            ↻ RETRY
          </button>
          {error.digest && (
            <div
              style={{
                marginTop: "2rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 10,
                color: "rgba(238,238,238,0.4)",
              }}
            >
              DIGEST · {error.digest}
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
