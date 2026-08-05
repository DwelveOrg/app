"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: catches throws in the root layout itself.
 *
 * This one replaces the entire document, so it must render its own <html> and
 * <body> and it cannot use anything from `providers.tsx` — no i18n, no theme,
 * no query client, because the tree that would have mounted them is what failed.
 * That is why the copy is English-only and the styling is inline: reaching for
 * a token or a `t()` here would depend on the layer that just broke.
 */
export default function GlobalError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error("[global error]", error.digest ?? "(no digest)", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#FAFAFB",
          color: "#15151B",
          fontFamily:
            "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <main style={{ maxWidth: "34rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
            Dwelve could not start
          </h1>
          <p style={{ marginTop: "0.75rem", lineHeight: 1.6, color: "#61616A" }}>
            Something failed before the app could load. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.6rem 1.1rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
              background: "#5F40D5",
              color: "#FFFFFF",
              font: "inherit",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
