"use client";

/**
 * Opens the Help panel on its "Ask us" tab (components/HelpPanel.tsx listens
 * for this event). A button, not a link: it goes nowhere, it opens something.
 * Wherever it is used, the email address stays beside it — that still works
 * with scripts off, and some people simply prefer their own mail app.
 */
export function AskButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("ds:help", { detail: { tab: "ask" } }))} className={className}>
      {children}
    </button>
  );
}
