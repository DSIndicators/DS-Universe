"use client";

/**
 * Opens the Help panel on its "Ask us" tab (components/HelpPanel.tsx listens
 * for this event). A button, not a link: it goes nowhere, it opens something.
 * Wherever it is used, the email address stays beside it — that still works
 * with scripts off, and some people simply prefer their own mail app.
 * `text` (optional) fills an empty question box — "Get notified" sends one.
 */
export function AskButton({ children, className = "", style, text }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; text?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("ds:help", { detail: { tab: "ask", text } }))} className={className} style={style}>
      {children}
    </button>
  );
}
