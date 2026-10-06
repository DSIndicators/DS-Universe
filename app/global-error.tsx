"use client";

/**
 * The last screen (2026-10-06): shown only if the site's own frame — the
 * layout itself — throws, so it cannot use the layout, its fonts or its
 * style sheet. Plain, dark, two ways on. See app/error.tsx for the screen a
 * page shows.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const link = { color: "#E9EDF2", textDecoration: "underline", textUnderlineOffset: 4, background: "none", border: 0, font: "inherit", cursor: "pointer", padding: 0 } as const;
  return (
    <html lang="en" translate="no">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#080A0D", color: "#AEB6C0", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}>
        <div style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, color: "#E9EDF2" }}>DS Universe stopped loading.</h1>
          <p style={{ margin: "16px 0 28px", fontSize: 15, lineHeight: 1.55 }}>Nothing was lost and nothing was charged.</p>
          <p style={{ margin: 0, fontSize: 15, display: "flex", gap: 24, justifyContent: "center" }}>
            <button type="button" onClick={reset} style={link}>Try again</button>
            <a href="/" style={link}>Home</a>
          </p>
        </div>
      </body>
    </html>
  );
}
