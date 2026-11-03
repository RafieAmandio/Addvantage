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
          background: "#0A0A0A",
          color: "rgba(255,255,255,0.9)",
          fontFamily:
            "Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 448,
            background: "#121212",
            borderRadius: 16,
            padding: 32,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Something went wrong
          </div>
          <h1 style={{ margin: "12px 0 0", fontSize: 22, lineHeight: "28px", fontWeight: 600, color: "#fff" }}>
            TradeVantage could not load
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: "21px", color: "rgba(255,255,255,0.55)" }}>
            A root-level fault took down the app. Reload to try again.
          </p>
          {error.digest && (
            <p style={{ margin: "12px 0 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Ref {error.digest}</p>
          )}
          <button
            onClick={() => reset()}
            style={{
              marginTop: 24,
              height: 44,
              padding: "0 24px",
              background: "#FFD400",
              color: "#000",
              border: 0,
              borderRadius: 9999,
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
