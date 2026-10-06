"use client";

import { useEffect } from "react";

/**
 * The error screen for a page (2026-10-06). Before this file existed, any
 * exception in the browser replaced the WHOLE site — bar, menu and footer
 * included — with Next's one grey line, "Application error: a client-side
 * exception has occurred". This keeps the frame of the site standing and
 * gives the visitor two ways on. components/DomGuard.tsx removes the one
 * cause that was found (a translated page); this is for whatever is not
 * known yet.
 */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="wrap py-32 text-center" translate="no">
      <p className="label">Error</p>
      <h1 className="display-lg mt-5 text-ink">This page stopped.</h1>
      <p className="lede mx-auto mt-5 max-w-md">Nothing was lost and nothing was charged. Load it again, or go back to the home page.</p>
      <div className="mt-9 flex justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        {/* a full page load on purpose: it starts the browser's copy of the site afresh */}
        <a href="/" className="btn-ghost">Home</a>
      </div>
    </section>
  );
}
