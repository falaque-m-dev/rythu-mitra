"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#faf9f6",
          color: "#14231f",
          fontFamily:
            '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
          textAlign: "center"
        }}
      >
        <main style={{ maxWidth: "32rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#5c6b66"
            }}
          >
            Application error
          </p>
          <h1 style={{ margin: "0.75rem 0 0", fontSize: "1.75rem", lineHeight: 1.2 }}>
            Rythu Mitra could not start
          </h1>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.95rem", lineHeight: 1.6, color: "#3d4a46" }}>
            An unexpected error stopped the application from rendering. Reload to try again. If the
            problem continues, contact the site operator.
          </p>
          {error.digest ? (
            <code
              style={{
                display: "inline-block",
                marginTop: "0.75rem",
                padding: "0.25rem 0.5rem",
                borderRadius: "0.375rem",
                background: "#eceae4",
                fontSize: "0.75rem",
                color: "#3d4a46"
              }}
            >
              Reference {error.digest}
            </code>
          ) : null}
          <div style={{ marginTop: "1.25rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                appearance: "none",
                border: 0,
                borderRadius: "0.75rem",
                padding: "0.65rem 1.25rem",
                background: "#12634a",
                color: "#faf9f6",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Reload application
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
